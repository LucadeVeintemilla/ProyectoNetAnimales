using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GanadoAPI.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCampoEstadoControlSalud : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "ControlesSalud",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Estado",
                table: "ControlesSalud");
        }
    }
}
