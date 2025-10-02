using System;
using System.Collections.Generic;

namespace ProyectoCursoIA.Models;

public class Medico
{
    public int Id { get; set; }
    public string PrimerNombre { get; set; } = string.Empty;
    public string SegundoNombre { get; set; } = string.Empty;
    public string ApellidoPaterno { get; set; } = string.Empty;
    public string ApellidoMaterno { get; set; } = string.Empty;
    public string Cedula { get; set; } = string.Empty;
    public long Telefono { get; set; }
    public string Especialidad { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; }

    public ICollection<Usuario> Usuarios { get; set; } = new HashSet<Usuario>();
    public ICollection<Consulta> Consultas { get; set; } = new HashSet<Consulta>();
}
