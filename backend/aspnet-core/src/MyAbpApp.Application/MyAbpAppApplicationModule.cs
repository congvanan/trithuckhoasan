using Volo.Abp.Account;
using Volo.CmsKit.Admin;
using Volo.CmsKit.Public;
using Volo.Abp.Mapperly;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement;
using Volo.Abp.SettingManagement;
using Volo.Abp.TenantManagement;
using Microsoft.Extensions.DependencyInjection;

namespace MyAbpApp;

[DependsOn(
    typeof(MyAbpAppDomainModule),
    typeof(AbpAccountApplicationModule),
    typeof(MyAbpAppApplicationContractsModule),
    typeof(AbpIdentityApplicationModule),
    typeof(AbpPermissionManagementApplicationModule),
    typeof(AbpTenantManagementApplicationModule),
    typeof(AbpFeatureManagementApplicationModule),
    typeof(AbpSettingManagementApplicationModule),
    typeof(CmsKitAdminApplicationModule),
    typeof(CmsKitPublicApplicationModule)
    )]
public class MyAbpAppApplicationModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        context.Services.AddMapperlyObjectMapper<MyAbpAppApplicationModule>();
    }
}
