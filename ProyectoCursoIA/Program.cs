using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using ProyectoCursoIA.Data;
using ProyectoCursoIA.Dtos;
using ProyectoCursoIA.Models;
using System.Globalization;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();
}

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

var api = app.MapGroup("/api");

MapUsuarioEndpoints(api.MapGroup("/usuarios"));
MapMedicoEndpoints(api.MapGroup("/medicos"));
MapPacienteEndpoints(api.MapGroup("/pacientes"));
MapConsultaEndpoints(api.MapGroup("/consultas"));
MapLoginEndpoint(api);

app.Run();

static void MapUsuarioEndpoints(RouteGroupBuilder group)
{
    group.MapGet("/", async (ApplicationDbContext db) =>
        await db.Usuarios
            .AsNoTracking()
            .Select(u => new UsuarioResponse(
                u.Id,
                u.Correo,
                u.NombreCompleto,
                u.IdMedico,
                u.Activo,
                u.FechaCreacion))
            .ToListAsync());

    group.MapGet("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
        var usuario = await db.Usuarios
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new UsuarioResponse(
                u.Id,
                u.Correo,
                u.NombreCompleto,
                u.IdMedico,
                u.Activo,
                u.FechaCreacion))
            .FirstOrDefaultAsync();

        return usuario is not null ? Results.Ok(usuario) : Results.NotFound();
    });

    group.MapPost("/", async (UsuarioCreateRequest request, ApplicationDbContext db) =>
    {
        var usuario = new Usuario
        {
            Correo = request.Correo,
            Password = request.Password,
            NombreCompleto = request.NombreCompleto,
            IdMedico = request.IdMedico,
            Activo = request.Activo
        };

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        var response = await db.Usuarios
            .AsNoTracking()
            .Where(u => u.Id == usuario.Id)
            .Select(u => new UsuarioResponse(
                u.Id,
                u.Correo,
                u.NombreCompleto,
                u.IdMedico,
                u.Activo,
                u.FechaCreacion))
            .FirstAsync();

        return Results.Created($"/api/usuarios/{usuario.Id}", response);
    });

    group.MapPut("/{id:int}", async (int id, UsuarioUpdateRequest input, ApplicationDbContext db) =>
    {
        var usuario = await db.Usuarios.FindAsync(id);
        if (usuario is null)
        {
            return Results.NotFound();
        }

        usuario.Correo = input.Correo;
        usuario.NombreCompleto = input.NombreCompleto;
        usuario.IdMedico = input.IdMedico;
        usuario.Activo = input.Activo;

        await db.SaveChangesAsync();

        var response = new UsuarioResponse(
            usuario.Id,
            usuario.Correo,
            usuario.NombreCompleto,
            usuario.IdMedico,
            usuario.Activo,
            usuario.FechaCreacion);

        return Results.Ok(response);
    });

    group.MapDelete("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
        var usuario = await db.Usuarios.FindAsync(id);
        if (usuario is null)
        {
            return Results.NotFound();
        }

        db.Usuarios.Remove(usuario);
        await db.SaveChangesAsync();
        return Results.NoContent();
    });
}

static void MapMedicoEndpoints(RouteGroupBuilder group)
{
    group.MapGet("/", async (ApplicationDbContext db, bool? soloActivos) =>
    {
        var query = db.Medicos.AsNoTracking();

        if (soloActivos is true)
        {
            query = query.Where(m => m.Activo);
        }

        var medicos = await query
            .Select(m => new
            {
                id = m.Id,
                primerNombre = m.PrimerNombre,
                segundoNombre = m.SegundoNombre,
                apellidoPaterno = m.ApellidoPaterno,
                apellidoMaterno = m.ApellidoMaterno,
                especialidad = m.Especialidad,
                email = m.Email,
                telefono = m.Telefono,
                activo = m.Activo,
                nombreCompleto = (m.PrimerNombre + " " + (m.SegundoNombre ?? "") + " " + m.ApellidoPaterno + " " + (m.ApellidoMaterno ?? "")).Trim()
            })
            .ToListAsync();

        return Results.Ok(medicos);
    });

    group.MapGet("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
        var medico = await db.Medicos
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id);

        return medico is not null ? Results.Ok(medico) : Results.NotFound();
    });

    group.MapPost("/", async (Medico medico, ApplicationDbContext db) =>
    {
        db.Medicos.Add(medico);
        await db.SaveChangesAsync();
        return Results.Created($"/api/medicos/{medico.Id}", medico);
    });

    group.MapPut("/{id:int}", async (int id, Medico input, ApplicationDbContext db) =>
    {
        var medico = await db.Medicos.FindAsync(id);
        if (medico is null)
        {
            return Results.NotFound();
        }

        medico.PrimerNombre = input.PrimerNombre;
        medico.SegundoNombre = input.SegundoNombre;
        medico.ApellidoPaterno = input.ApellidoPaterno;
        medico.ApellidoMaterno = input.ApellidoMaterno;
        medico.Cedula = input.Cedula;
        medico.Telefono = input.Telefono;
        medico.Especialidad = input.Especialidad;
        medico.Email = input.Email;
        medico.Activo = input.Activo;

        await db.SaveChangesAsync();
        return Results.NoContent();
    });

    group.MapDelete("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
        var medico = await db.Medicos.FindAsync(id);
        if (medico is null)
        {
            return Results.NotFound();
        }

        db.Medicos.Remove(medico);
        await db.SaveChangesAsync();
        return Results.NoContent();
    });
}

static void MapPacienteEndpoints(RouteGroupBuilder group)
{
    group.MapGet("/", async (ApplicationDbContext db, bool? soloActivos) =>
    {
        var query = db.Pacientes.AsNoTracking();

        if (soloActivos is true)
        {
            query = query.Where(p => p.Activo);
        }

        var pacientes = await query
            .Select(p => new
            {
                id = p.Id,
                primerNombre = p.PrimerNombre,
                segundoNombre = p.SegundoNombre,
                apellidoPaterno = p.ApellidoPaterno,
                apellidoMaterno = p.ApellidoMaterno,
                telefono = p.Telefono,
                activo = p.Activo,
                nombreCompleto = (p.PrimerNombre + " " + (p.SegundoNombre ?? "") + " " + p.ApellidoPaterno + " " + (p.ApellidoMaterno ?? "")).Trim()
            })
            .ToListAsync();

        return Results.Ok(pacientes);
    });

    group.MapGet("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
        var paciente = await db.Pacientes
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        return paciente is not null ? Results.Ok(paciente) : Results.NotFound();
    });

    group.MapPost("/", async (Paciente paciente, ApplicationDbContext db) =>
    {
        db.Pacientes.Add(paciente);
        await db.SaveChangesAsync();
        return Results.Created($"/api/pacientes/{paciente.Id}", paciente);
    });

    group.MapPut("/{id:int}", async (int id, Paciente input, ApplicationDbContext db) =>
    {
        var paciente = await db.Pacientes.FindAsync(id);
        if (paciente is null)
        {
            return Results.NotFound();
        }

        paciente.PrimerNombre = input.PrimerNombre;
        paciente.SegundoNombre = input.SegundoNombre;
        paciente.ApellidoPaterno = input.ApellidoPaterno;
        paciente.ApellidoMaterno = input.ApellidoMaterno;
        paciente.Telefono = input.Telefono;
        paciente.Activo = input.Activo;

        await db.SaveChangesAsync();
        return Results.NoContent();
    });

    group.MapDelete("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
        var paciente = await db.Pacientes.FindAsync(id);
        if (paciente is null)
        {
            return Results.NotFound();
        }

        db.Pacientes.Remove(paciente);
        await db.SaveChangesAsync();
        return Results.NoContent();
    });
}

static void MapConsultaEndpoints(RouteGroupBuilder group)
{
    group.MapGet("/", async (ApplicationDbContext db, int? top, int? idMedico, int? idPaciente, string? fecha) =>
    {
        var query = db.Consultas
            .AsNoTracking()
            .Include(c => c.Medico)
            .Include(c => c.Paciente)
            .AsQueryable();

        if (idMedico.HasValue)
        {
            query = query.Where(c => c.IdMedico == idMedico.Value);
        }

        if (idPaciente.HasValue)
        {
            query = query.Where(c => c.IdPaciente == idPaciente.Value);
        }

        if (!string.IsNullOrWhiteSpace(fecha))
        {
            if (DateTime.TryParseExact(fecha, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fechaFiltro))
            {
                var siguienteDia = fechaFiltro.AddDays(1);
                query = query.Where(c => c.FechaCreacion >= fechaFiltro && c.FechaCreacion < siguienteDia);
            }
        }

        query = query.OrderByDescending(c => c.Id);

        if (top.HasValue)
        {
            query = query.Take(top.Value);
        }

        var consultas = await query
            .Select(c => new ConsultaResponse(
                c.Id,
                c.IdMedico,
                c.IdPaciente,
                (c.Medico.PrimerNombre + " " + (c.Medico.SegundoNombre ?? "") + " " + c.Medico.ApellidoPaterno + " " + (c.Medico.ApellidoMaterno ?? "")).Trim(),
                (c.Paciente.PrimerNombre + " " + (c.Paciente.SegundoNombre ?? "") + " " + c.Paciente.ApellidoPaterno + " " + (c.Paciente.ApellidoMaterno ?? "")).Trim(),
                c.Sintomas,
                c.Recomendaciones,
                c.Diagnostico,
                c.FechaCreacion))
            .ToListAsync();

        return Results.Ok(consultas);
    });

    group.MapGet("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
        var consulta = await db.Consultas
            .AsNoTracking()
            .Include(c => c.Medico)
            .Include(c => c.Paciente)
            .Where(c => c.Id == id)
            .Select(c => new ConsultaResponse(
                c.Id,
                c.IdMedico,
                c.IdPaciente,
                (c.Medico.PrimerNombre + " " + (c.Medico.SegundoNombre ?? "") + " " + c.Medico.ApellidoPaterno + " " + (c.Medico.ApellidoMaterno ?? "")).Trim(),
                (c.Paciente.PrimerNombre + " " + (c.Paciente.SegundoNombre ?? "") + " " + c.Paciente.ApellidoPaterno + " " + (c.Paciente.ApellidoMaterno ?? "")).Trim(),
                c.Sintomas,
                c.Recomendaciones,
                c.Diagnostico,
                c.FechaCreacion))
            .FirstOrDefaultAsync();

        return consulta is not null ? Results.Ok(consulta) : Results.NotFound();
    });

    group.MapPost("/", async (ConsultaRequest request, ApplicationDbContext db) =>
    {
        var medicoExiste = await db.Medicos.AnyAsync(m => m.Id == request.IdMedico);
        if (!medicoExiste)
        {
            return Results.BadRequest(new { message = "El médico especificado no existe." });
        }

        var pacienteExiste = await db.Pacientes.AnyAsync(p => p.Id == request.IdPaciente);
        if (!pacienteExiste)
        {
            return Results.BadRequest(new { message = "El paciente especificado no existe." });
        }

        var consulta = new Consulta
        {
            IdMedico = request.IdMedico,
            IdPaciente = request.IdPaciente,
            Sintomas = request.Sintomas,
            Recomendaciones = request.Recomendaciones,
            Diagnostico = request.Diagnostico
        };

        db.Consultas.Add(consulta);
        await db.SaveChangesAsync();

        var respuesta = await db.Consultas
            .AsNoTracking()
            .Include(c => c.Medico)
            .Include(c => c.Paciente)
            .Where(c => c.Id == consulta.Id)
            .Select(c => new ConsultaResponse(
                c.Id,
                c.IdMedico,
                c.IdPaciente,
                (c.Medico.PrimerNombre + " " + (c.Medico.SegundoNombre ?? "") + " " + c.Medico.ApellidoPaterno + " " + (c.Medico.ApellidoMaterno ?? "")).Trim(),
                (c.Paciente.PrimerNombre + " " + (c.Paciente.SegundoNombre ?? "") + " " + c.Paciente.ApellidoPaterno + " " + (c.Paciente.ApellidoMaterno ?? "")).Trim(),
                c.Sintomas,
                c.Recomendaciones,
                c.Diagnostico,
                c.FechaCreacion))
            .FirstAsync();

        return Results.Created($"/api/consultas/{consulta.Id}", respuesta);
    });

    group.MapPut("/{id:int}", async (int id, ConsultaRequest request, ApplicationDbContext db) =>
    {
        var consulta = await db.Consultas.FindAsync(id);
        if (consulta is null)
        {
            return Results.NotFound();
        }

        var medicoExiste = await db.Medicos.AnyAsync(m => m.Id == request.IdMedico);
        if (!medicoExiste)
        {
            return Results.BadRequest(new { message = "El médico especificado no existe." });
        }

        var pacienteExiste = await db.Pacientes.AnyAsync(p => p.Id == request.IdPaciente);
        if (!pacienteExiste)
        {
            return Results.BadRequest(new { message = "El paciente especificado no existe." });
        }

        consulta.IdMedico = request.IdMedico;
        consulta.IdPaciente = request.IdPaciente;
        consulta.Sintomas = request.Sintomas;
        consulta.Recomendaciones = request.Recomendaciones;
        consulta.Diagnostico = request.Diagnostico;

        await db.SaveChangesAsync();
        return Results.NoContent();
    });

    group.MapDelete("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
        var consulta = await db.Consultas.FindAsync(id);
        if (consulta is null)
        {
            return Results.NotFound();
        }

        db.Consultas.Remove(consulta);
        await db.SaveChangesAsync();
        return Results.NoContent();
    });
}

static void MapLoginEndpoint(RouteGroupBuilder group)
{
    group.MapPost("/login", async (LoginRequest request, ApplicationDbContext db) =>
    {
        var usuario = await db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Correo == request.Correo && u.Password == request.Password);

        if (usuario is null)
        {
            return Results.Json(
                new { message = "Usuario o contraseña incorrectos." },
                statusCode: StatusCodes.Status401Unauthorized);
        }

        if (!usuario.Activo)
        {
            return Results.Json(
                new { message = "El usuario no está activo." },
                statusCode: StatusCodes.Status401Unauthorized);
        }

        return Results.Ok(new
        {
            id = usuario.Id,
            nombreCompleto = usuario.NombreCompleto,
            correo = usuario.Correo
        });
    });
}

public record LoginRequest(string Correo, string Password);

public record ConsultaRequest(int IdMedico, int IdPaciente, string Sintomas, string? Recomendaciones, string? Diagnostico);

public record ConsultaResponse(int Id, int IdMedico, int IdPaciente, string MedicoNombre, string PacienteNombre, string Sintomas, string? Recomendaciones, string? Diagnostico, DateTime FechaCreacion);

public partial class Program;
