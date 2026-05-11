using Volo.CmsKit.GlobalFeatures;
using Volo.Abp.GlobalFeatures;
using Volo.Abp.Threading;

namespace Mydoctor;

public static class MydoctorGlobalFeatureConfigurator
{
    private static readonly OneTimeRunner OneTimeRunner = new OneTimeRunner();

    public static void Configure()
    {
        OneTimeRunner.Run(() =>
        {
            GlobalFeatureManager.Instance.Modules.CmsKit(cmsKit =>
            {
                cmsKit.EnableAll();
            });
        });
    }
}
