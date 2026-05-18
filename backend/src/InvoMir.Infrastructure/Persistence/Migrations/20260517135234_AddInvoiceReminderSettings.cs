using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoMir.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceReminderSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RemindersEnabled",
                table: "invoices",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateIndex(
                name: "IX_invoices_TenantId_RemindersEnabled",
                table: "invoices",
                columns: new[] { "TenantId", "RemindersEnabled" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_invoices_TenantId_RemindersEnabled",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "RemindersEnabled",
                table: "invoices");
        }
    }
}
