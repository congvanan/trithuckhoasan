using Mydoctor.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace Mydoctor.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class MydoctorController : AbpControllerBase
{
    protected MydoctorController()
    {
        LocalizationResource = typeof(MydoctorResource);
    }
}
