using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProyectoCursoIA.Models;

[Table("tblPruebas")]
public class TblPrueba
{
    [Key]
    [Column("ID")]
    public int Id { get; set; }

    [DataType(DataType.DateTime)]
    public DateTime Fecha { get; set; }

    [StringLength(10)]
    public string NumeroCel { get; set; } = string.Empty;
}
