using Localization.Resources.AbpUi;
using Mydoctor.Localization;
using Volo.Abp.Account;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Localization;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement.HttpApi;
using Volo.CmsKit.Admin;
using Volo.CmsKit.Public;
using Volo.Abp.SettingManagement;
using Volo.Abp.TenantManagement;

namespace Mydoctor;

[DependsOn(
    typeof(MydoctorApplicationContractsModule),
    typeof(AbpAccountHttpApiModule),
    typeof(AbpIdentityHttpApiModule),
    typeof(AbpPermissionManagementHttpApiModule),
    typeof(AbpTenantManagementHttpApiModule),
    typeof(AbpFeatureManagementHttpApiModule),
    typeof(AbpSettingManagementHttpApiModule),
    typeof(CmsKitAdminHttpApiModule),
    typeof(CmsKitPublicHttpApiModule)
    )]
public class MydoctorHttpApiModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        ConfigureLocalization();
    }

    private void ConfigureLocalization()
    {
        Configure<AbpLocalizationOptions>(options =>
        {
            options.Resources
                .Get<MydoctorResource>()
                .AddBaseTypes(
                    typeof(AbpUiResource)
                );
        });
    }
}
