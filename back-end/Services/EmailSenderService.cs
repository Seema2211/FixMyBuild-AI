using System.Net;
using System.Net.Mail;
using FixMyBuildApi.Data;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Services;

public class EmailSenderService : IEmailSenderService
{
    private readonly AppDbContext _db;

    public EmailSenderService(AppDbContext db) => _db = db;

    public async Task SendAsync(string toEmail, string subject, string htmlBody, Guid orgId, CancellationToken ct = default)
    {
        var settings = await _db.NotificationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == orgId, ct);

        if (settings is null || string.IsNullOrWhiteSpace(settings.SmtpHost))
            throw new InvalidOperationException(
                "Email is not configured for this organisation. Set up SMTP in Settings → Notifications.");

        using var smtp = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
        {
            EnableSsl = settings.SmtpUseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
        };

        if (!string.IsNullOrWhiteSpace(settings.SmtpUsername))
            smtp.Credentials = new NetworkCredential(settings.SmtpUsername, settings.SmtpPassword ?? "");

        var from = settings.SmtpFromEmail ?? settings.SmtpUsername ?? "noreply@fixmybuild.ai";
        using var message = new MailMessage(from, toEmail, subject, htmlBody) { IsBodyHtml = true };

        await smtp.SendMailAsync(message, ct);
    }
}
