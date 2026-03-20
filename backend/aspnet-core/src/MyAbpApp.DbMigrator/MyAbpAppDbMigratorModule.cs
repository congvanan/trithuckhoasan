using MyAbpApp.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace MyAbpApp.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(MyAbpAppEntityFrameworkCoreModule),
    typeof(MyAbpAppApplicationContractsModule)
    )]
public class MyAbpAppDbMigratorModule : AbpModule
{
}
