using Mydoctor.Localization;
using Volo.Abp.AspNetCore.Mvc.UI.RazorPages;

namespace Mydoctor.Web.Pages;

/* Inherit your PageModel classes from this class.
 */
public abstract class MydoctorPageModel : AbpPageModel
{
    protected MydoctorPageModel()
    {
        LocalizationResourceType = typeof(MydoctorResource);
    }
}
