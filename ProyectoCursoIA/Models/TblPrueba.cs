using System.ComponentModel.DataAnnotations;

namespace ProyectoCursoIA.Models;

public class TblPrueba
{
    public int ID { get; set; }

    public DateTime Fecha { get; set; }

    [StringLength(10)]
    public required string NumeroCel { get; set; }
}
