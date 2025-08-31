using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GanadoAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTipoAdquisicionUbicacionToAnimal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TipoAdquisicion",
                table: "Animales",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Ubicacion",
                table: "Animales",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TipoAdquisicion",
                table: "Animales");

            migrationBuilder.DropColumn(
                name: "Ubicacion",
                table: "Animales");
        }
    }
}
