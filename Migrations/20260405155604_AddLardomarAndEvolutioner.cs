using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Viaproxima.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddLardomarAndEvolutioner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Evolutioner",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CharacterId = table.Column<int>(type: "INTEGER", nullable: false),
                    Namn = table.Column<string>(type: "TEXT", nullable: false),
                    Niva = table.Column<int>(type: "INTEGER", nullable: false),
                    Beskrivning = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Evolutioner", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Evolutioner_Characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "Characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Lardomar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CharacterId = table.Column<int>(type: "INTEGER", nullable: false),
                    Namn = table.Column<string>(type: "TEXT", nullable: false),
                    Niva = table.Column<int>(type: "INTEGER", nullable: false),
                    Beskrivning = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lardomar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Lardomar_Characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "Characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Evolutioner_CharacterId",
                table: "Evolutioner",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_Lardomar_CharacterId",
                table: "Lardomar",
                column: "CharacterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Evolutioner");

            migrationBuilder.DropTable(
                name: "Lardomar");
        }
    }
}
