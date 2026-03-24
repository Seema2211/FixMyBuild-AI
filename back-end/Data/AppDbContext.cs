using System.Text.Json;
using FixMyBuildApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace FixMyBuildApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ── Auth ────────────────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<UserToken> UserTokens => Set<UserToken>();

    // ── Billing ─────────────────────────────────────────────────
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<SubscriptionUsage> SubscriptionUsages => Set<SubscriptionUsage>();

    // ── Pipeline ────────────────────────────────────────────────
    public DbSet<PipelineFailure> PipelineFailures => Set<PipelineFailure>();
    public DbSet<PipelineSource> PipelineSources => Set<PipelineSource>();
    public DbSet<ConnectedRepository> ConnectedRepositories => Set<ConnectedRepository>();
    public DbSet<NotificationSetting> NotificationSettings => Set<NotificationSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var jsonConverter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
        );
        var jsonComparer = new ValueComparer<List<string>>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
            v => v.ToList()
        );

        // ── User ────────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(256);
            e.Property(u => u.FirstName).HasMaxLength(100);
            e.Property(u => u.LastName).HasMaxLength(100);
        });

        // ── Organization ────────────────────────────────────────
        modelBuilder.Entity<Organization>(e =>
        {
            e.HasKey(o => o.Id);
            e.HasIndex(o => o.Slug).IsUnique();
            e.Property(o => o.Name).HasMaxLength(200);
            e.Property(o => o.Slug).HasMaxLength(200);
        });

        // ── OrganizationMember ──────────────────────────────────
        modelBuilder.Entity<OrganizationMember>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasIndex(m => new { m.OrganizationId, m.UserId }).IsUnique();
            e.HasOne(m => m.Organization).WithMany(o => o.Members).HasForeignKey(m => m.OrganizationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.User).WithMany(u => u.OrganizationMemberships).HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── RefreshToken ────────────────────────────────────────
        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.TokenHash);
            e.HasOne(r => r.User).WithMany(u => u.RefreshTokens).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── ApiKey ──────────────────────────────────────────────
        modelBuilder.Entity<ApiKey>(e =>
        {
            e.HasKey(k => k.Id);
            e.HasIndex(k => k.KeyHash);
            e.HasOne(k => k.Organization).WithMany(o => o.ApiKeys).HasForeignKey(k => k.OrganizationId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── Invitation ──────────────────────────────────────────
        modelBuilder.Entity<Invitation>(e =>
        {
            e.HasKey(i => i.Id);
            e.HasIndex(i => i.TokenHash).IsUnique();
            e.HasIndex(i => new { i.OrganizationId, i.Email });
            e.Property(i => i.Email).HasMaxLength(256);
            e.Property(i => i.Role).HasMaxLength(20);
            e.HasOne(i => i.Organization).WithMany().HasForeignKey(i => i.OrganizationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(i => i.InvitedBy).WithMany().HasForeignKey(i => i.InvitedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        // ── UserToken ────────────────────────────────────────────
        modelBuilder.Entity<UserToken>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => t.TokenHash).IsUnique();
            e.HasIndex(t => new { t.UserId, t.Type });
            e.Property(t => t.Type).HasMaxLength(50);
            e.HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── AuditLog ────────────────────────────────────────────
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasIndex(a => new { a.OrganizationId, a.CreatedAt });
            e.Property(a => a.Action).HasMaxLength(100);
            e.Property(a => a.ActorEmail).HasMaxLength(256);
            e.Property(a => a.TargetEmail).HasMaxLength(256);
        });

        // ── PipelineFailure ─────────────────────────────────────
        modelBuilder.Entity<PipelineFailure>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.KeyErrorLines).HasConversion(jsonConverter, jsonComparer).HasColumnType("text");
            e.OwnsOne(f => f.CreatedPullRequest, pr =>
            {
                pr.Property(p => p.PrNumber).HasColumnName("PrNumber");
                pr.Property(p => p.HtmlUrl).HasColumnName("PrHtmlUrl");
                pr.Property(p => p.BranchName).HasColumnName("PrBranchName");
                pr.Property(p => p.Title).HasColumnName("PrTitle");
                pr.Property(p => p.Body).HasColumnName("PrBody");
                pr.Property(p => p.ChangesSummary).HasColumnName("PrChangesSummary");
            });
        });

        // ── PipelineSource ──────────────────────────────────────
        modelBuilder.Entity<PipelineSource>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasMany(s => s.Repositories).WithOne(r => r.PipelineSource).HasForeignKey(r => r.PipelineSourceId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── ConnectedRepository ─────────────────────────────────
        modelBuilder.Entity<ConnectedRepository>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => new { r.PipelineSourceId, r.FullName }).IsUnique();
        });

        // ── NotificationSetting ─────────────────────────────────
        modelBuilder.Entity<NotificationSetting>(e =>
        {
            e.HasKey(s => s.Id);
        });

        // ── Subscription ─────────────────────────────────────────
        modelBuilder.Entity<Subscription>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.OrganizationId).IsUnique();
            e.HasIndex(s => s.StripeCustomerId);
            e.HasIndex(s => s.StripeSubscriptionId);
            e.Property(s => s.Plan).HasConversion<string>();
            e.Property(s => s.Status).HasConversion<string>();
            e.HasOne(s => s.Organization).WithOne(o => o.Subscription).HasForeignKey<Subscription>(s => s.OrganizationId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── SubscriptionUsage ────────────────────────────────────
        modelBuilder.Entity<SubscriptionUsage>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => new { u.OrganizationId, u.Month }).IsUnique();
            e.HasOne(u => u.Organization).WithMany(o => o.SubscriptionUsages).HasForeignKey(u => u.OrganizationId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
