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
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Mydoctor.Ai;
using System;

namespace Mydoctor;

[DependsOn(
    typeof(MydoctorDomainModule),
    typeof(AbpAccountApplicationModule),
    typeof(MydoctorApplicationContractsModule),
    typeof(AbpIdentityApplicationModule),
    typeof(AbpPermissionManagementApplicationModule),
    typeof(AbpTenantManagementApplicationModule),
    typeof(AbpFeatureManagementApplicationModule),
    typeof(AbpSettingManagementApplicationModule),
    typeof(CmsKitAdminApplicationModule),
    typeof(CmsKitPublicApplicationModule)
    )]
public class MydoctorApplicationModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        context.Services.AddMapperlyObjectMapper<MydoctorApplicationModule>();
        context.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

        context.Services.AddHttpClient("ai", c =>
        {
            c.Timeout = TimeSpan.FromSeconds(60);
            c.DefaultRequestHeaders.UserAgent.ParseAdd("Mydoctor-Ai/1.0");
        });

        // Layer 2: Content extractors registered in order of precedence
        context.Services.AddTransient<IContentExtractor, ManualContentExtractor>();
        context.Services.AddTransient<IContentExtractor, CmsBlogPostExtractor>();
        context.Services.AddTransient<IContentExtractor, CmsPageExtractor>();
        context.Services.AddTransient<IContentExtractor, UrlContentExtractor>();
    }
}
