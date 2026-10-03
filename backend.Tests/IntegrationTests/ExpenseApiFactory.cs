using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using backend.Data;

namespace backend.Tests.IntegrationTests;

/// <summary>
/// Fabrique d'hote hermetique : remplace le fournisseur MySQL par EF Core InMemory
/// afin que la suite d'integration ne depende d'aucun serveur de base de donnees externe.
/// </summary>
public class ExpenseApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"expense-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
            services.RemoveAll(typeof(DbContextOptions));
            services.RemoveAll(typeof(IDbContextOptionsConfiguration<AppDbContext>));

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
        });
    }
}
