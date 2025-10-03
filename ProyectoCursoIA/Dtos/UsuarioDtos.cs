using System;

namespace ProyectoCursoIA.Dtos;

public record UsuarioResponse(int Id, string Correo, string NombreCompleto, int? IdMedico, bool Activo, DateTime FechaCreacion);

public record UsuarioCreateRequest(string Correo, string Password, string NombreCompleto, int? IdMedico, bool Activo);

public record UsuarioUpdateRequest(string Correo, string NombreCompleto, int? IdMedico, bool Activo);
