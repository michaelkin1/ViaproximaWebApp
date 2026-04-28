using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Viaproxima.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddCharacterGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "Characters",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CharacterGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CharacterGroups", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Characters_GroupId",
                table: "Characters",
                column: "GroupId");

            migrationBuilder.AddForeignKey(
                name: "FK_Characters_CharacterGroups_GroupId",
                table: "Characters",
                column: "GroupId",
                principalTable: "CharacterGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Characters_CharacterGroups_GroupId",
                table: "Characters");

            migrationBuilder.DropTable(
                name: "CharacterGroups");

            migrationBuilder.DropIndex(
                name: "IX_Characters_GroupId",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "Characters");
        }
    }
}
