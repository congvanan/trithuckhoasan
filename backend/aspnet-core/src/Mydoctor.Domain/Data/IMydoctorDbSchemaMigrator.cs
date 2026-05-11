using System.Threading.Tasks;

namespace Mydoctor.Data;

public interface IMydoctorDbSchemaMigrator
{
    Task MigrateAsync();
}
