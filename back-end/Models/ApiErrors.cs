using FixMyBuildApi.Services;

namespace FixMyBuildApi.Models;

/// <summary>
/// Factory for standard API error responses.
/// ALWAYS use these methods — never inline error JSON in endpoints.
/// Guarantees the frontend error handler receives a consistent shape every time.
/// </summary>
public static class ApiErrors
{
    /// <summary>
    /// 402 response for plan limit violations.
    /// Shape: { error: "plan_limit", limit: string, plan: string, upgradeUrl: string }
    /// </summary>
    public static IResult PlanLimit(PlanLimitException ex) =>
        Results.Json(new
        {
            error      = "plan_limit",
            limit      = ex.LimitName,
            plan       = ex.CurrentPlan.ToString().ToLower(),
            upgradeUrl = "/pricing"
        }, statusCode: 402);
}
