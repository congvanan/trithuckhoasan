using System;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Mydoctor.Ai;
using Npgsql;
using Pgvector.EntityFrameworkCore;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore.PostgreSql;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.Modularity;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.CmsKit.EntityFrameworkCore;
using Volo.Abp.TenantManagement.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Mydoctor.EntityFrameworkCore;

[DependsOn(
    typeof(MydoctorDomainModule),
    typeof(AbpIdentityEntityFrameworkCoreModule),
    typeof(AbpOpenIddictEntityFrameworkCoreModule),
    typeof(AbpPermissionManagementEntityFrameworkCoreModule),
    typeof(AbpSettingManagementEntityFrameworkCoreModule),
    typeof(AbpEntityFrameworkCorePostgreSqlModule),
    typeof(AbpBackgroundJobsEntityFrameworkCoreModule),
    typeof(AbpAuditLoggingEntityFrameworkCoreModule),
    typeof(AbpTenantManagementEntityFrameworkCoreModule),
    typeof(AbpFeatureManagementEntityFrameworkCoreModule),
    typeof(CmsKitEntityFrameworkCoreModule)
    )]
public class MydoctorEntityFrameworkCoreModule : AbpModule
{
    // Cache data sources by connection string to reuse Npgsql connection pools
    private static readonly Dictionary<string, NpgsqlDataSource> DataSources = new();
    private static readonly object Lock = new();

    public override void PreConfigureServices(ServiceConfigurationContext context)
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
        MydoctorEfCoreEntityExtensionMappings.Configure();
    }

    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        context.Services.AddTransient<IVectorStore, PgVectorScaleStore>();

        context.Services.AddAbpDbContext<MydoctorDbContext>(options =>
        {
            options.AddDefaultRepositories(includeAllEntities: true);
        });

        // Npgsql 9+: the vector type must be registered on an NpgsqlDataSource.
        // Priority:
        //  1. A pre-registered NpgsqlDataSource singleton (set by DbMigrator / Host startup)
        //  2. Built lazily from ctx.ConnectionString (resolved by ABP's IConnectionStringResolver)
        //  3. Built lazily from IConfiguration.GetConnectionString("Default")
        Configure<AbpDbContextOptions>(options =>
        {
            options.Configure(ctx =>
            {
                // Try pre-registered data source first
                var dataSource = ctx.ServiceProvider?.GetService<NpgsqlDataSource>();

                if (dataSource == null)
                {
                    var cs = ctx.ConnectionString;
                    if (string.IsNullOrEmpty(cs))
                        cs = ctx.ServiceProvider?.GetService<IConfiguration>()?.GetConnectionString("Default");

                    if (string.IsNullOrEmpty(cs))
                        throw new InvalidOperationException(
                            "PostgreSQL connection string 'Default' is not configured. " +
                            "Register NpgsqlDataSource or set ConnectionStrings:Default.");

                    lock (Lock)
                    {
                        if (!DataSources.TryGetValue(cs, out dataSource!))
                        {
                            var builder = new NpgsqlDataSourceBuilder(cs);
                            builder.UseVector();
                            dataSource = builder.Build();
                            DataSources[cs] = dataSource;
                        }
                    }
                }

                ctx.DbContextOptions.UseNpgsql(dataSource, npgsql => npgsql.UseVector());
            });
        });
    }
}
