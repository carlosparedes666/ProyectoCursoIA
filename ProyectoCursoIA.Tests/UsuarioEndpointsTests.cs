using System;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
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
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Usuario>>();
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();

        var usuario = new Usuario
        {
            Correo = "correo@example.com",
            NombreCompleto = "Usuario Prueba",
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };
        usuario.Password = passwordHasher.HashPassword(usuario, "Secreto123");

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        var token = await AuthenticateAsync("correo@example.com", "Secreto123");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

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
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Usuario>>();
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();

        var usuario = new Usuario
        {
            Correo = "admin@example.com",
            NombreCompleto = "Administrador",
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };
        usuario.Password = passwordHasher.HashPassword(usuario, "AdminPass123!");

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        var token = await AuthenticateAsync("admin@example.com", "AdminPass123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

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

    private async Task<string> AuthenticateAsync(string correo, string password)
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.PostAsJsonAsync("/api/login", new { correo, password });
        response.EnsureSuccessStatusCode();

        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login!.Token));

        return login.Token;
    }

    private sealed record LoginResponse(int Id, string NombreCompleto, string Correo, string Token, DateTime ExpiresAt);
}
