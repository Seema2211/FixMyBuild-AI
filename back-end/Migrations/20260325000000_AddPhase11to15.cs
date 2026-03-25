using FixMyBuildApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FixMyBuildApi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260325000000_AddPhase11to15")]
    public partial class AddPhase11to15 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── RefreshToken: add session tracking columns ───────
            migrationBuilder.AddColumn<string>(
                name: "IpAddress", table: "RefreshTokens",
                type: "character varying(64)", maxLength: 64, nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent", table: "RefreshTokens",
                type: "character varying(512)", maxLength: 512, nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUsedAt", table: "RefreshTokens",
                type: "timestamp with time zone", nullable: true);

            // ── AppNotifications ─────────────────────────────────
            migrationBuilder.CreateTable(
                name: "AppNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Link = table.Column<string>(type: "text", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppNotifications", x => x.Id);
                    table.ForeignKey(name: "FK_AppNotifications_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations", principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "IX_AppNotifications_OrgCreatedAt",
                table: "AppNotifications",
                columns: new[] { "OrganizationId", "CreatedAt" });

            migrationBuilder.CreateIndex(name: "IX_AppNotifications_UserIsRead",
                table: "AppNotifications",
                columns: new[] { "UserId", "IsRead" });

            // ── OutboundWebhooks ─────────────────────────────────
            migrationBuilder.CreateTable(
                name: "OutboundWebhooks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    Secret = table.Column<string>(type: "text", nullable: true),
                    Events = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboundWebhooks", x => x.Id);
                    table.ForeignKey(name: "FK_OutboundWebhooks_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations", principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "IX_OutboundWebhooks_OrganizationId",
                table: "OutboundWebhooks", column: "OrganizationId");

            // ── WebhookDeliveries ────────────────────────────────
            migrationBuilder.CreateTable(
                name: "WebhookDeliveries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WebhookId = table.Column<Guid>(type: "uuid", nullable: false),
                    Event = table.Column<string>(type: "text", nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: false),
                    StatusCode = table.Column<int>(type: "integer", nullable: true),
                    ResponseBody = table.Column<string>(type: "text", nullable: true),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebhookDeliveries", x => x.Id);
                    table.ForeignKey(name: "FK_WebhookDeliveries_OutboundWebhooks_WebhookId",
                        column: x => x.WebhookId,
                        principalTable: "OutboundWebhooks", principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "IX_WebhookDeliveries_WebhookIdCreatedAt",
                table: "WebhookDeliveries",
                columns: new[] { "WebhookId", "CreatedAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "WebhookDeliveries");
            migrationBuilder.DropTable(name: "OutboundWebhooks");
            migrationBuilder.DropTable(name: "AppNotifications");
            migrationBuilder.DropColumn(name: "IpAddress", table: "RefreshTokens");
            migrationBuilder.DropColumn(name: "UserAgent", table: "RefreshTokens");
            migrationBuilder.DropColumn(name: "LastUsedAt", table: "RefreshTokens");
        }
    }
}
