using System;
using Volo.Abp.Data;
using Volo.Abp.Modularity;

namespace MyAbpApp.MongoDB;

[DependsOn(
    typeof(MyAbpAppApplicationTestModule),
    typeof(MyAbpAppMongoDbModule)
)]
public class MyAbpAppMongoDbTestModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpDbConnectionOptions>(options =>
        {
            options.ConnectionStrings.Default = MyAbpAppMongoDbFixture.GetRandomConnectionString();
        });
    }
}
