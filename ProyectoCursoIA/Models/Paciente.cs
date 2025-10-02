using System;
using System.Collections.Generic;

namespace ProyectoCursoIA.Models;

public class Paciente
{
    public int Id { get; set; }
    public string PrimerNombre { get; set; } = string.Empty;
    public string SegundoNombre { get; set; } = string.Empty;
    public string ApellidoPaterno { get; set; } = string.Empty;
    public string ApellidoMaterno { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; }

    public ICollection<Consulta> Consultas { get; set; } = new HashSet<Consulta>();
}
