using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoMir.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFullAuditingHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "users",
                newName: "CreationTime");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "tenants",
                newName: "CreationTime");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "refresh_tokens",
                newName: "CreationTime");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "password_reset_tokens",
                newName: "CreationTime");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "users",
                newName: "LastModificationTime");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "tenants",
                newName: "LastModificationTime");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "refresh_tokens",
                newName: "LastModificationTime");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "password_reset_tokens",
                newName: "LastModificationTime");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreationTime",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreationTime",
                table: "tenants",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreationTime",
                table: "refresh_tokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreationTime",
                table: "password_reset_tokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<string>(
                name: "ConcurrencyStamp",
                table: "users",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValueSql: "md5(random()::text || clock_timestamp()::text)");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatorUserId",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeleterUserId",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletionTime",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "LastModifierUserId",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConcurrencyStamp",
                table: "tenants",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValueSql: "md5(random()::text || clock_timestamp()::text)");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatorUserId",
                table: "tenants",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeleterUserId",
                table: "tenants",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletionTime",
                table: "tenants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "LastModifierUserId",
                table: "tenants",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConcurrencyStamp",
                table: "refresh_tokens",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValueSql: "md5(random()::text || clock_timestamp()::text)");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatorUserId",
                table: "refresh_tokens",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeleterUserId",
                table: "refresh_tokens",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletionTime",
                table: "refresh_tokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "refresh_tokens",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "LastModifierUserId",
                table: "refresh_tokens",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConcurrencyStamp",
                table: "password_reset_tokens",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValueSql: "md5(random()::text || clock_timestamp()::text)");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatorUserId",
                table: "password_reset_tokens",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeleterUserId",
                table: "password_reset_tokens",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletionTime",
                table: "password_reset_tokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "password_reset_tokens",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "LastModifierUserId",
                table: "password_reset_tokens",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_TenantId_IsActive_IsDeleted",
                table: "users",
                columns: new[] { "TenantId", "IsActive", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_users_TenantId_IsDeleted",
                table: "users",
                columns: new[] { "TenantId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_tenants_IsActive_IsDeleted",
                table: "tenants",
                columns: new[] { "IsActive", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_tenants_IsDeleted",
                table: "tenants",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_TenantId_IsDeleted",
                table: "refresh_tokens",
                columns: new[] { "TenantId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_TenantId_UserId_IsRevoked_IsDeleted",
                table: "refresh_tokens",
                columns: new[] { "TenantId", "UserId", "IsRevoked", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_UserId_IsRevoked_IsDeleted",
                table: "refresh_tokens",
                columns: new[] { "UserId", "IsRevoked", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_UserId_IsDeleted",
                table: "password_reset_tokens",
                columns: new[] { "UserId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_UserId_IsUsed_IsDeleted",
                table: "password_reset_tokens",
                columns: new[] { "UserId", "IsUsed", "IsDeleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_TenantId_IsActive_IsDeleted",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_TenantId_IsDeleted",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_tenants_IsActive_IsDeleted",
                table: "tenants");

            migrationBuilder.DropIndex(
                name: "IX_tenants_IsDeleted",
                table: "tenants");

            migrationBuilder.DropIndex(
                name: "IX_refresh_tokens_TenantId_IsDeleted",
                table: "refresh_tokens");

            migrationBuilder.DropIndex(
                name: "IX_refresh_tokens_TenantId_UserId_IsRevoked_IsDeleted",
                table: "refresh_tokens");

            migrationBuilder.DropIndex(
                name: "IX_refresh_tokens_UserId_IsRevoked_IsDeleted",
                table: "refresh_tokens");

            migrationBuilder.DropIndex(
                name: "IX_password_reset_tokens_UserId_IsDeleted",
                table: "password_reset_tokens");

            migrationBuilder.DropIndex(
                name: "IX_password_reset_tokens_UserId_IsUsed_IsDeleted",
                table: "password_reset_tokens");

            migrationBuilder.DropColumn(
                name: "ConcurrencyStamp",
                table: "users");

            migrationBuilder.DropColumn(
                name: "CreatorUserId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "DeleterUserId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "DeletionTime",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "users");

            migrationBuilder.DropColumn(
                name: "LastModifierUserId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ConcurrencyStamp",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "CreatorUserId",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "DeleterUserId",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "DeletionTime",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "LastModifierUserId",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "ConcurrencyStamp",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "CreatorUserId",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "DeleterUserId",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "DeletionTime",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "LastModifierUserId",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "ConcurrencyStamp",
                table: "password_reset_tokens");

            migrationBuilder.DropColumn(
                name: "CreatorUserId",
                table: "password_reset_tokens");

            migrationBuilder.DropColumn(
                name: "DeleterUserId",
                table: "password_reset_tokens");

            migrationBuilder.DropColumn(
                name: "DeletionTime",
                table: "password_reset_tokens");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "password_reset_tokens");

            migrationBuilder.DropColumn(
                name: "LastModifierUserId",
                table: "password_reset_tokens");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreationTime",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreationTime",
                table: "tenants",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreationTime",
                table: "refresh_tokens",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreationTime",
                table: "password_reset_tokens",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.RenameColumn(
                name: "LastModificationTime",
                table: "users",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "LastModificationTime",
                table: "tenants",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "LastModificationTime",
                table: "refresh_tokens",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "LastModificationTime",
                table: "password_reset_tokens",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "CreationTime",
                table: "users",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "CreationTime",
                table: "tenants",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "CreationTime",
                table: "refresh_tokens",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "CreationTime",
                table: "password_reset_tokens",
                newName: "CreatedAt");
        }
    }
}
