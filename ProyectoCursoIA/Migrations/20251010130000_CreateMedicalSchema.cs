using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProyectoCursoIA.Migrations
{
    /// <inheritdoc />
    public partial class CreateMedicalSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Medicos",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    primer_nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    segundo_nombre = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    apellido_paterno = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    apellido_materno = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    cedula = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    telefono = table.Column<long>(type: "bigint", nullable: false),
                    especialidad = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    activo = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    fecha_creacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Medicos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Paciente",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    primer_nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    segundo_nombre = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    apellido_paterno = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    apellido_materno = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    telefono = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    activo = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    fecha_creacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Paciente", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Usuario",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    correo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    nombre_completo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    id_medico = table.Column<int>(type: "int", nullable: true),
                    activo = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    fecha_creacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuario", x => x.id);
                    table.ForeignKey(
                        name: "FK_Usuario_Medicos_id_medico",
                        column: x => x.id_medico,
                        principalTable: "Medicos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Consulta",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_medico = table.Column<int>(type: "int", nullable: false),
                    id_paciente = table.Column<int>(type: "int", nullable: false),
                    sintomas = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    recomendaciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    diagnostico = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Consulta", x => x.id);
                    table.ForeignKey(
                        name: "FK_Consulta_Medicos_id_medico",
                        column: x => x.id_medico,
                        principalTable: "Medicos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Consulta_Paciente_id_paciente",
                        column: x => x.id_paciente,
                        principalTable: "Paciente",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Consulta_id_medico",
                table: "Consulta",
                column: "id_medico");

            migrationBuilder.CreateIndex(
                name: "IX_Consulta_id_paciente",
                table: "Consulta",
                column: "id_paciente");

            migrationBuilder.CreateIndex(
                name: "IX_Usuario_id_medico",
                table: "Usuario",
                column: "id_medico");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Consulta");

            migrationBuilder.DropTable(
                name: "Usuario");

            migrationBuilder.DropTable(
                name: "Paciente");

            migrationBuilder.DropTable(
                name: "Medicos");
        }
    }
}
