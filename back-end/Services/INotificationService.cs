using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public interface INotificationService
{
    Task<NotificationSetting> GetSettingsAsync(Guid orgId, CancellationToken ct = default);
    Task<NotificationSetting> UpdateSettingsAsync(NotificationSetting settings, Guid orgId, CancellationToken ct = default);
    Task<bool> TestSlackAsync(Guid orgId, CancellationToken ct = default);
    Task<bool> TestEmailAsync(string testRecipient, Guid orgId, CancellationToken ct = default);

    // Called from background worker — uses orgId from the failure record
    Task NotifyFailureAsync(PipelineFailure failure, CancellationToken ct = default);
}
