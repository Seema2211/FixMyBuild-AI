using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using FixMyBuildApi.Data;

#nullable disable

namespace FixMyBuildApi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260326000000_AddSelfLearning")]
    public partial class AddSelfLearning : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── FailureFeedbacks ─────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "FailureFeedbacks",
                columns: table => new
                {
                    Id                   = table.Column<Guid>(type: "uuid", nullable: false),
                    OrgId                = table.Column<Guid>(type: "uuid", nullable: false),
                    PipelineFailureId    = table.Column<string>(type: "text", nullable: false),
                    Category             = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ErrorFingerprint     = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OriginalFixSuggestion = table.Column<string>(type: "text", nullable: false),
                    ActualFix            = table.Column<string>(type: "text", nullable: true),
                    Outcome              = table.Column<string>(type: "text", nullable: false, defaultValue: "Pending"),
                    OutcomeSource        = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    OutcomeRecordedAt    = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OriginalConfidence   = table.Column<int>(type: "integer", nullable: false),
                    PrNumber             = table.Column<int>(type: "integer", nullable: true),
                    PrUrl                = table.Column<string>(type: "text", nullable: true),
                    RepoOwner            = table.Column<string>(type: "text", nullable: true),
                    RepoName             = table.Column<string>(type: "text", nullable: true),
                    CreatedAt            = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table => table.PrimaryKey("PK_FailureFeedbacks", x => x.Id));

            migrationBuilder.CreateIndex(
                name: "IX_FailureFeedbacks_OrgId_PipelineFailureId",
                table: "FailureFeedbacks",
                columns: new[] { "OrgId", "PipelineFailureId" });

            migrationBuilder.CreateIndex(
                name: "IX_FailureFeedbacks_OrgId_PrNumber_RepoOwner_RepoName",
                table: "FailureFeedbacks",
                columns: new[] { "OrgId", "PrNumber", "RepoOwner", "RepoName" });

            migrationBuilder.CreateIndex(
                name: "IX_FailureFeedbacks_OrgId_ErrorFingerprint",
                table: "FailureFeedbacks",
                columns: new[] { "OrgId", "ErrorFingerprint" });

            // ── FailurePatterns ──────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "FailurePatterns",
                columns: table => new
                {
                    Id               = table.Column<Guid>(type: "uuid", nullable: false),
                    OrgId            = table.Column<Guid>(type: "uuid", nullable: false),
                    Category         = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ErrorFingerprint = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OccurrenceCount  = table.Column<int>(type: "integer", nullable: false),
                    AcceptedCount    = table.Column<int>(type: "integer", nullable: false),
                    RejectedCount    = table.Column<int>(type: "integer", nullable: false),
                    ModifiedCount    = table.Column<int>(type: "integer", nullable: false),
                    AcceptanceRate   = table.Column<double>(type: "double precision", nullable: false),
                    LastSuccessfulFix = table.Column<string>(type: "text", nullable: true),
                    FirstSeenAt      = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeenAt       = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table => table.PrimaryKey("PK_FailurePatterns", x => x.Id));

            migrationBuilder.CreateIndex(
                name: "IX_FailurePatterns_OrgId_Category_ErrorFingerprint",
                table: "FailurePatterns",
                columns: new[] { "OrgId", "Category", "ErrorFingerprint" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "FailureFeedbacks");
            migrationBuilder.DropTable(name: "FailurePatterns");
        }
    }
}
