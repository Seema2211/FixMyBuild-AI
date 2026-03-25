using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Services;

public interface IWebhookDeliveryService
{
    Task DeliverAsync(Guid orgId, string eventType, object payload, CancellationToken ct = default);
}

public class WebhookDeliveryService : IWebhookDeliveryService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpFactory;

    public WebhookDeliveryService(IServiceScopeFactory scopeFactory, IHttpClientFactory httpFactory)
    {
        _scopeFactory = scopeFactory;
        _httpFactory = httpFactory;
    }

    public Task DeliverAsync(Guid orgId, string eventType, object payload, CancellationToken ct = default)
    {
        // Fire and forget — don't block the ingest response
        _ = Task.Run(() => DeliverInternalAsync(orgId, eventType, payload), CancellationToken.None);
        return Task.CompletedTask;
    }

    private async Task DeliverInternalAsync(Guid orgId, string eventType, object payload)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var webhooks = await db.OutboundWebhooks
            .Where(w => w.OrganizationId == orgId && w.IsActive && w.Events.Contains(eventType))
            .ToListAsync();

        if (webhooks.Count == 0) return;

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var bodyJson = JsonSerializer.Serialize(new
        {
            @event = eventType,
            timestamp = DateTime.UtcNow,
            data = payload
        }, jsonOptions);

        foreach (var webhook in webhooks)
        {
            await DeliverToWebhookAsync(db, webhook, eventType, bodyJson);
        }
    }

    private async Task DeliverToWebhookAsync(AppDbContext db, OutboundWebhook webhook, string eventType, string bodyJson)
    {
        var client = _httpFactory.CreateClient("WebhookDelivery");
        int attempt = 0;
        int? statusCode = null;
        string? responseBody = null;
        string? errorMessage = null;
        bool success = false;

        var delays = new[] { 0, 5000, 30000 }; // immediate, 5s, 30s

        while (attempt < 3)
        {
            if (delays[attempt] > 0)
                await Task.Delay(delays[attempt]);

            attempt++;
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, webhook.Url)
                {
                    Content = new StringContent(bodyJson, Encoding.UTF8, "application/json")
                };
                request.Headers.Add("X-FMB-Event", eventType);
                request.Headers.Add("X-FMB-Delivery", Guid.NewGuid().ToString());

                if (!string.IsNullOrEmpty(webhook.Secret))
                {
                    var sig = ComputeHmac(bodyJson, webhook.Secret);
                    request.Headers.Add("X-FMB-Signature", $"sha256={sig}");
                }

                var response = await client.SendAsync(request, new CancellationTokenSource(TimeSpan.FromSeconds(10)).Token);
                statusCode = (int)response.StatusCode;
                responseBody = await response.Content.ReadAsStringAsync();
                success = response.IsSuccessStatusCode;

                if (success) break;
            }
            catch (Exception ex)
            {
                errorMessage = ex.Message;
            }
        }

        db.WebhookDeliveries.Add(new WebhookDelivery
        {
            WebhookId = webhook.Id,
            Event = eventType,
            Payload = bodyJson,
            StatusCode = statusCode,
            ResponseBody = responseBody?.Length > 2000 ? responseBody[..2000] : responseBody,
            AttemptCount = attempt,
            Success = success,
            ErrorMessage = errorMessage,
        });

        await db.SaveChangesAsync();
    }

    private static string ComputeHmac(string payload, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        var hash = HMACSHA256.HashData(keyBytes, payloadBytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
