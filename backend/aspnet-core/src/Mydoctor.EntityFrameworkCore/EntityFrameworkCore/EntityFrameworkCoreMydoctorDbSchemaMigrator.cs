using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Mydoctor.Data;
using Volo.Abp.DependencyInjection;

namespace Mydoctor.EntityFrameworkCore;

public class EntityFrameworkCoreMydoctorDbSchemaMigrator
    : IMydoctorDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreMydoctorDbSchemaMigrator(
        IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolve the MydoctorDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<MydoctorDbContext>()
            .Database
            .MigrateAsync();
    }
}
