using FixMyBuildApi.Services;

namespace FixMyBuildApi.Extensions;

public static class BillingEndpoints
{
    public static void MapBillingEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/billing");

        // GET /api/billing/plans — public, returns all plan details
        group.MapGet("/plans", (ISubscriptionService svc) =>
        {
            return Results.Ok(svc.GetPublicPlans());
        });

        // GET /api/billing/plan — current org plan + usage
        group.MapGet("/plan", async (HttpContext ctx, ISubscriptionService svc) =>
        {
            var orgId = ctx.User.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            var plan = await svc.GetCurrentPlanAsync(orgId.Value);
            return Results.Ok(plan);
        }).RequireAuthorization();

        // POST /api/billing/checkout — create Stripe Checkout session
        group.MapPost("/checkout", async (HttpContext ctx, ISubscriptionService svc, IConfiguration config, CheckoutRequest req) =>
        {
            var orgId = ctx.User.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            var frontEndUrl = config["AppSettings:FrontEndUrl"]!;
            var url = await svc.CreateCheckoutSessionAsync(
                orgId.Value,
                req.PriceId,
                successUrl: $"{frontEndUrl}/settings?tab=billing&checkout=success",
                cancelUrl: $"{frontEndUrl}/pricing"
            );
            return Results.Ok(new { url });
        }).RequireAuthorization();

        // POST /api/billing/portal — create Stripe Billing Portal session
        group.MapPost("/portal", async (HttpContext ctx, ISubscriptionService svc, IConfiguration config) =>
        {
            var orgId = ctx.User.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            var frontEndUrl = config["AppSettings:FrontEndUrl"]!;
            try
            {
                var url = await svc.CreateBillingPortalSessionAsync(orgId.Value, returnUrl: $"{frontEndUrl}/settings?tab=billing");
                return Results.Ok(new { url });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        }).RequireAuthorization();

        // POST /api/billing/webhook — Stripe webhook (no auth, signature verified inside)
        group.MapPost("/webhook", async (HttpContext ctx, ISubscriptionService svc) =>
        {
            using var reader = new StreamReader(ctx.Request.Body);
            var payload = await reader.ReadToEndAsync();
            var signature = ctx.Request.Headers["Stripe-Signature"].ToString();

            try
            {
                await svc.HandleWebhookAsync(payload, signature);
                return Results.Ok();
            }
            catch (Stripe.StripeException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });
    }
}

public record CheckoutRequest(string PriceId);
