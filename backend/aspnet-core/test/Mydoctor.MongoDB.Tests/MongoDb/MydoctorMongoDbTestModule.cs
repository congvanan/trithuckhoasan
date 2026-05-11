using System;
using Volo.Abp.Data;
using Volo.Abp.Modularity;

namespace Mydoctor.MongoDB;

[DependsOn(
    typeof(MydoctorApplicationTestModule),
    typeof(MydoctorMongoDbModule)
)]
public class MydoctorMongoDbTestModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpDbConnectionOptions>(options =>
        {
            options.ConnectionStrings.Default = MydoctorMongoDbFixture.GetRandomConnectionString();
        });
    }
}
