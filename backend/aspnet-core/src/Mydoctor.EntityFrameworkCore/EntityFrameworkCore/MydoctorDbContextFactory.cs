using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Pgvector.EntityFrameworkCore;

namespace Mydoctor.EntityFrameworkCore;

/* This class is needed for EF Core console commands
 * (like Add-Migration and Update-Database commands) */
public class MydoctorDbContextFactory : IDesignTimeDbContextFactory<MydoctorDbContext>
{
    public MydoctorDbContext CreateDbContext(string[] args)
    {
        MydoctorEfCoreEntityExtensionMappings.Configure();

        var configuration = BuildConfiguration();

        var connectionString = configuration.GetConnectionString("Default")!;
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
        dataSourceBuilder.UseVector();
        var dataSource = dataSourceBuilder.Build();

        var builder = new DbContextOptionsBuilder<MydoctorDbContext>()
            .UseNpgsql(dataSource, npgsql => npgsql.UseVector());

        return new MydoctorDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../Mydoctor.DbMigrator/"))
            .AddJsonFile("appsettings.json", optional: false);

        return builder.Build();
    }
}
