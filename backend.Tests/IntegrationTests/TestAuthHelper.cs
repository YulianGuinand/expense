using System.Net.Http.Headers;
using System.Net.Http.Json;
using backend.DTOs;

namespace backend.Tests.IntegrationTests;

public static class TestAuthHelper
{
    public const string DefaultPassword = "Passw0rd!";

    public static async Task<HttpClient> CreateAuthenticatedClientAsync(
        this ExpenseApiFactory factory,
        string? username = null,
        string? email = null)
    {
        var client = factory.CreateClient();
        var authResponse = await RegisterAsync(client, username ?? "UtilisateurTest", email ?? GenerateUniqueEmail());
        client.SetBearerToken(authResponse.Token);
        return client;
    }

    public static async Task<AuthResponseDto> RegisterAsync(
        HttpClient client,
        string username,
        string email,
        string password = DefaultPassword)
    {
        var response = await client.PostAsJsonAsync(
            "/api/Auth/register",
            new UserRegisterDto(username, email, password));

        response.EnsureSuccessStatusCode();

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        return authResponse ?? throw new InvalidOperationException("Reponse d'inscription vide.");
    }

    public static void SetBearerToken(this HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public static string GenerateUniqueEmail() => $"user-{Guid.NewGuid():N}@expense.test";
}
