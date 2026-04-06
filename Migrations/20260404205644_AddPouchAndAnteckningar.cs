using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Viaproxima.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddPouchAndAnteckningar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Anteckningar",
                table: "Characters",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Pouch",
                table: "Characters",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Anteckningar",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Pouch",
                table: "Characters");
        }
    }
}
