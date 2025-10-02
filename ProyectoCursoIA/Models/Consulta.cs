using System;

namespace ProyectoCursoIA.Models;

public class Consulta
{
    public int Id { get; set; }
    public int IdMedico { get; set; }
    public int IdPaciente { get; set; }
    public string Sintomas { get; set; } = string.Empty;
    public string? Recomendaciones { get; set; }
    public string? Diagnostico { get; set; }

    public Medico Medico { get; set; } = null!;
    public Paciente Paciente { get; set; } = null!;
}
