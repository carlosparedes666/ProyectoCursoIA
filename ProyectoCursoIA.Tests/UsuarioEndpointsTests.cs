using System;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using ProyectoCursoIA.Data;
using ProyectoCursoIA.Models;
using Xunit;

namespace ProyectoCursoIA.Tests;

public class UsuarioEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public UsuarioEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetUsuarios_ShouldNotExposePassword()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();

        db.Usuarios.Add(new Usuario
        {
            Correo = "correo@example.com",
            Password = "Secreto123",
            NombreCompleto = "Usuario Prueba",
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var response = await _client.GetAsync("/api/usuarios");
        response.EnsureSuccessStatusCode();

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var usuarios = document.RootElement;

        Assert.True(usuarios.ValueKind == JsonValueKind.Array && usuarios.GetArrayLength() == 1);
        var usuario = usuarios[0];

        Assert.DoesNotContain(usuario.EnumerateObject(), p => string.Equals(p.Name, "Password", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task PostUsuarios_ResponseShouldNotIncludePassword()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();

        var payload = new
        {
            correo = "nuevo@example.com",
            password = "ClaveSegura1",
            nombreCompleto = "Nuevo Usuario",
            idMedico = (int?)null,
            activo = true
        };

        var response = await _client.PostAsJsonAsync("/api/usuarios", payload);
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var usuario = document.RootElement;

        Assert.DoesNotContain(usuario.EnumerateObject(), p => string.Equals(p.Name, "Password", StringComparison.OrdinalIgnoreCase));
    }
}
