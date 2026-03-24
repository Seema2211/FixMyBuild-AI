using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext db, IHttpClientFactory httpClientFactory, ILogger<NotificationService> logger)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<NotificationSetting> GetSettingsAsync(Guid orgId, CancellationToken ct = default)
    {
        var settings = await _db.NotificationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == orgId, ct);
        return settings ?? new NotificationSetting { OrganizationId = orgId };
    }

    public async Task<NotificationSetting> UpdateSettingsAsync(NotificationSetting updated, Guid orgId, CancellationToken ct = default)
    {
        var existing = await _db.NotificationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == orgId, ct);
        if (existing is null)
        {
            updated.OrganizationId = orgId;
            updated.UpdatedAt = DateTime.UtcNow;
            _db.NotificationSettings.Add(updated);
        }
        else
        {
            existing.SlackWebhookUrl = updated.SlackWebhookUrl;
            existing.SlackEnabled = updated.SlackEnabled;
            existing.SmtpHost = updated.SmtpHost;
            existing.SmtpPort = updated.SmtpPort;
            existing.SmtpUsername = updated.SmtpUsername;
            if (!string.IsNullOrEmpty(updated.SmtpPassword))
                existing.SmtpPassword = updated.SmtpPassword;
            existing.SmtpFromEmail = updated.SmtpFromEmail;
            existing.SmtpUseSsl = updated.SmtpUseSsl;
            existing.EmailEnabled = updated.EmailEnabled;
            existing.NotifyPrAuthor = updated.NotifyPrAuthor;
            existing.AdditionalRecipients = updated.AdditionalRecipients;
            existing.NotifyOnHigh = updated.NotifyOnHigh;
            existing.NotifyOnMedium = updated.NotifyOnMedium;
            existing.NotifyOnLow = updated.NotifyOnLow;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return await GetSettingsAsync(orgId, ct);
    }

    public async Task<bool> TestSlackAsync(Guid orgId, CancellationToken ct = default)
    {
        var settings = await GetSettingsAsync(orgId, ct);
        if (string.IsNullOrWhiteSpace(settings.SlackWebhookUrl)) return false;

        var payload = new
        {
            blocks = new object[]
            {
                new { type = "header", text = new { type = "plain_text", text = "🔧 FixMyBuild AI — Test Notification", emoji = true } },
                new { type = "section", text = new { type = "mrkdwn", text = "✅ *Slack integration is working!*\n\nYou'll receive pipeline failure notifications here." } }
            }
        };

        return await PostSlackMessageAsync(settings.SlackWebhookUrl, payload, ct);
    }

    public async Task<bool> TestEmailAsync(string testRecipient, Guid orgId, CancellationToken ct = default)
    {
        var settings = await GetSettingsAsync(orgId, ct);
        if (string.IsNullOrWhiteSpace(settings.SmtpHost) || string.IsNullOrWhiteSpace(settings.SmtpFromEmail))
            return false;

        var subject = "🔧 FixMyBuild AI — Test Notification";
        var body = "<h2>FixMyBuild AI</h2><p>✅ Email notification is working!</p><p>You'll receive pipeline failure alerts at this address.</p>";

        return await SendEmailAsync(settings, testRecipient, subject, body, ct);
    }

    public async Task NotifyFailureAsync(PipelineFailure failure, CancellationToken ct = default)
    {
        if (failure.OrganizationId is null) return;
        var settings = await GetSettingsAsync(failure.OrganizationId.Value, ct);

        // Check severity filter
        var severity = failure.Severity?.ToLower() ?? "medium";
        var shouldNotify = severity switch
        {
            "high" => settings.NotifyOnHigh,
            "medium" => settings.NotifyOnMedium,
            "low" => settings.NotifyOnLow,
            _ => settings.NotifyOnMedium
        };

        if (!shouldNotify) return;

        // Send Slack notification
        if (settings.SlackEnabled && !string.IsNullOrWhiteSpace(settings.SlackWebhookUrl))
        {
            try
            {
                var payload = BuildSlackPayload(failure);
                await PostSlackMessageAsync(settings.SlackWebhookUrl, payload, ct);
                _logger.LogInformation("Slack notification sent for {FailureId}", failure.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send Slack notification for {FailureId}", failure.Id);
            }
        }

        // Send Email notification
        if (settings.EmailEnabled && !string.IsNullOrWhiteSpace(settings.SmtpHost))
        {
            var recipients = BuildRecipientList(failure, settings);
            if (recipients.Count > 0)
            {
                try
                {
                    var subject = BuildEmailSubject(failure);
                    var body = BuildEmailBody(failure);
                    foreach (var recipient in recipients)
                    {
                        await SendEmailAsync(settings, recipient, subject, body, ct);
                    }
                    _logger.LogInformation("Email notification sent to {Count} recipients for {FailureId}", recipients.Count, failure.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send email notification for {FailureId}", failure.Id);
                }
            }
        }
    }

    // ── Slack ─────────────────────────────────────────────────────

    private async Task<bool> PostSlackMessageAsync(string webhookUrl, object payload, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient();
        var json = JsonSerializer.Serialize(payload);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PostAsync(webhookUrl, content, ct);
        return response.IsSuccessStatusCode;
    }

    private static object BuildSlackPayload(PipelineFailure failure)
    {
        var severityEmoji = (failure.Severity?.ToLower()) switch
        {
            "high" => "🔴",
            "medium" => "🟡",
            "low" => "🟢",
            _ => "⚪"
        };

        var prText = failure.CreatedPullRequest?.HtmlUrl != null
            ? $"✅ *<{failure.CreatedPullRequest.HtmlUrl}|Auto-fix PR #{failure.CreatedPullRequest.PrNumber}>* created"
            : "⏳ No auto-fix PR (confidence below threshold)";

        var actorText = !string.IsNullOrWhiteSpace(failure.ActorLogin)
            ? $"👤 *Triggered by:* `{failure.ActorLogin}`" + (!string.IsNullOrWhiteSpace(failure.CommitAuthorEmail) ? $" ({failure.CommitAuthorEmail})" : "")
            : "";

        return new
        {
            blocks = new object[]
            {
                new { type = "header", text = new { type = "plain_text", text = $"⚡ Pipeline Failure Detected", emoji = true } },
                new { type = "section", text = new { type = "mrkdwn", text =
                    $"{severityEmoji} *Severity:* {failure.Severity?.ToUpper() ?? "UNKNOWN"} | *Confidence:* {failure.Confidence}%\n" +
                    $"*Pipeline:* `{failure.PipelineName}`\n" +
                    $"*Repo:* `{failure.RepoOwner}/{failure.RepoName}`\n" +
                    (!string.IsNullOrWhiteSpace(failure.FailedStage) ? $"*Failed Stage:* `{failure.FailedStage}`\n" : "") +
                    (!string.IsNullOrWhiteSpace(actorText) ? actorText + "\n" : "")
                } },
                new { type = "section", text = new { type = "mrkdwn", text =
                    $"*🔍 Root Cause:*\n{failure.RootCause}\n\n" +
                    $"*💡 Suggested Fix:*\n{Truncate(failure.FixSuggestion, 300)}"
                } },
                new { type = "section", text = new { type = "mrkdwn", text = prText } },
                new { type = "context", elements = new[] { new { type = "mrkdwn", text = $"_Analyzed by FixMyBuild AI • {failure.CreatedAt:yyyy-MM-dd HH:mm} UTC_" } } }
            }
        };
    }

    // ── Email ─────────────────────────────────────────────────────

    private static List<string> BuildRecipientList(PipelineFailure failure, NotificationSetting settings)
    {
        var recipients = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // Dynamic: PR author's email from Git
        if (settings.NotifyPrAuthor && !string.IsNullOrWhiteSpace(failure.CommitAuthorEmail))
        {
            // Skip noreply GitHub emails
            if (!failure.CommitAuthorEmail.Contains("noreply.github.com"))
                recipients.Add(failure.CommitAuthorEmail);
        }

        // Static: additional recipients
        if (!string.IsNullOrWhiteSpace(settings.AdditionalRecipients))
        {
            foreach (var email in settings.AdditionalRecipients.Split(',', ';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (email.Contains('@'))
                    recipients.Add(email);
            }
        }

        return recipients.ToList();
    }

    private static string BuildEmailSubject(PipelineFailure failure)
    {
        var severity = failure.Severity?.ToUpper() ?? "UNKNOWN";
        return $"[FixMyBuild AI] {severity} — {failure.PipelineName} failed in {failure.RepoOwner}/{failure.RepoName}";
    }

    private static string BuildEmailBody(PipelineFailure failure)
    {
        var severityColor = (failure.Severity?.ToLower()) switch
        {
            "high" => "#dc2626",
            "medium" => "#d97706",
            "low" => "#059669",
            _ => "#6b7280"
        };

        var prSection = failure.CreatedPullRequest?.HtmlUrl != null
            ? $"<div style='background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;margin:16px 0'><strong>✅ Auto-fix PR created:</strong> <a href='{failure.CreatedPullRequest.HtmlUrl}'>PR #{failure.CreatedPullRequest.PrNumber}</a></div>"
            : "<div style='background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin:16px 0'>⏳ No auto-fix PR — confidence below threshold. Manual review needed.</div>";

        var actorSection = !string.IsNullOrWhiteSpace(failure.ActorLogin)
            ? $"<tr><td style='padding:8px 0;color:#6b7280;font-weight:600'>Triggered By</td><td style='padding:8px 0'>{failure.ActorLogin}" +
              (!string.IsNullOrWhiteSpace(failure.CommitAuthorEmail) ? $" ({failure.CommitAuthorEmail})" : "") + "</td></tr>"
            : "";

        return $@"
<!DOCTYPE html>
<html>
<body style='font-family:Inter,system-ui,sans-serif;margin:0;padding:0;background:#f8fafc'>
<div style='max-width:600px;margin:0 auto;padding:24px'>
  <div style='background:linear-gradient(135deg,#0f172a,#1e1b4b);border-radius:12px 12px 0 0;padding:20px 24px'>
    <h1 style='color:white;font-size:18px;margin:0'>⚡ FixMyBuild AI</h1>
    <p style='color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0'>Pipeline Failure Alert</p>
  </div>
  <div style='background:white;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px'>
    <div style='display:inline-block;background:{severityColor}15;color:{severityColor};border:1px solid {severityColor}40;border-radius:99px;padding:4px 12px;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px'>
      {failure.Severity?.ToUpper() ?? "UNKNOWN"} SEVERITY
    </div>
    <table style='width:100%;font-size:14px;border-collapse:collapse'>
      <tr><td style='padding:8px 0;color:#6b7280;font-weight:600;width:120px'>Pipeline</td><td style='padding:8px 0'>{failure.PipelineName}</td></tr>
      <tr><td style='padding:8px 0;color:#6b7280;font-weight:600'>Repository</td><td style='padding:8px 0'>{failure.RepoOwner}/{failure.RepoName}</td></tr>
      {(failure.FailedStage != null ? $"<tr><td style='padding:8px 0;color:#6b7280;font-weight:600'>Failed Stage</td><td style='padding:8px 0'>{failure.FailedStage}</td></tr>" : "")}
      <tr><td style='padding:8px 0;color:#6b7280;font-weight:600'>Confidence</td><td style='padding:8px 0'>{failure.Confidence}%</td></tr>
      {actorSection}
    </table>
    <hr style='border:none;border-top:1px solid #e2e8f0;margin:16px 0'>
    <h3 style='font-size:14px;color:#111827;margin:0 0 8px'>🔍 Root Cause</h3>
    <p style='font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px'>{failure.RootCause}</p>
    <h3 style='font-size:14px;color:#111827;margin:0 0 8px'>💡 Suggested Fix</h3>
    <p style='font-size:14px;color:#374151;line-height:1.6;margin:0'>{failure.FixSuggestion}</p>
    {prSection}
    <p style='font-size:12px;color:#9ca3af;margin:16px 0 0;text-align:center'>Analyzed by FixMyBuild AI • {failure.CreatedAt:yyyy-MM-dd HH:mm} UTC</p>
  </div>
</div>
</body>
</html>";
    }

    private async Task<bool> SendEmailAsync(NotificationSetting settings, string to, string subject, string htmlBody, CancellationToken ct)
    {
        using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
        {
            Credentials = new NetworkCredential(settings.SmtpUsername, settings.SmtpPassword),
            EnableSsl = settings.SmtpUseSsl
        };

        using var message = new MailMessage
        {
            From = new MailAddress(settings.SmtpFromEmail ?? "noreply@fixmybuild.ai", "FixMyBuild AI"),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(to);

        await client.SendMailAsync(message, ct);
        return true;
    }

    private static string Truncate(string? text, int maxLength)
    {
        if (string.IsNullOrEmpty(text)) return "";
        return text.Length <= maxLength ? text : text[..maxLength] + "...";
    }
}
