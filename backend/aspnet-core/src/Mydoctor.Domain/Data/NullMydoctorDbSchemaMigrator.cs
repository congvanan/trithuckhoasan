using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace Mydoctor.Data;

/* This is used if database provider does't define
 * IMydoctorDbSchemaMigrator implementation.
 */
public class NullMydoctorDbSchemaMigrator : IMydoctorDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
