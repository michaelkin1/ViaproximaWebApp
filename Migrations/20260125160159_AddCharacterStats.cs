using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Viaproxima.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddCharacterStats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Akrobatik",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Allmanbildning",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Aurar",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Blockera",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Brottas",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Cuppar",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Ferrar",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Fingerfardighet",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Forflytta",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Fysisk",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Genomslag",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Intelligens",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Intryck",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "KannaAvFara",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Klokhet",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Ljuga",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LogisktTankande",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MagiskKansla",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Mental",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OgaForDetaljer",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Overtala",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SeIgenomLogner",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SkadaArmar",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SkadaBen",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SkadaHuvud",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SkadaTorso",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Skicklighet",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Skytte",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Snabbtankthet",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Talighet",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Traffsakerhet",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Uppfinningsrikedom",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Uthallighet",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Utstralning",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "VackaKanslor",
                table: "Characters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Akrobatik",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Allmanbildning",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Aurar",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Blockera",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Brottas",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Cuppar",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Ferrar",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Fingerfardighet",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Forflytta",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Fysisk",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Genomslag",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Intelligens",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Intryck",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "KannaAvFara",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Klokhet",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Ljuga",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "LogisktTankande",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "MagiskKansla",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Mental",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "OgaForDetaljer",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Overtala",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "SeIgenomLogner",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "SkadaArmar",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "SkadaBen",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "SkadaHuvud",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "SkadaTorso",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Skicklighet",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Skytte",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Snabbtankthet",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Talighet",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Traffsakerhet",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Uppfinningsrikedom",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Uthallighet",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Utstralning",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "VackaKanslor",
                table: "Characters");
        }
    }
}
