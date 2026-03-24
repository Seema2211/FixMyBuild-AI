using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FixMyBuildApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAiAnalysesUsed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AiAnalysesUsed",
                table: "SubscriptionUsages",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiAnalysesUsed",
                table: "SubscriptionUsages");
        }
    }
}
