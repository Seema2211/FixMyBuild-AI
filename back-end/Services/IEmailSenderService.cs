namespace FixMyBuildApi.Services;

public interface IEmailSenderService
{
    /// <summary>
    /// Sends an HTML email using the org's configured SMTP settings.
    /// Throws InvalidOperationException if SMTP is not configured.
    /// </summary>
    Task SendAsync(string toEmail, string subject, string htmlBody, Guid orgId, CancellationToken ct = default);
}
