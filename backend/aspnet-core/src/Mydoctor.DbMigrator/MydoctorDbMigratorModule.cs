using Mydoctor.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace Mydoctor.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(MydoctorEntityFrameworkCoreModule),
    typeof(MydoctorApplicationContractsModule)
    )]
public class MydoctorDbMigratorModule : AbpModule
{
}
