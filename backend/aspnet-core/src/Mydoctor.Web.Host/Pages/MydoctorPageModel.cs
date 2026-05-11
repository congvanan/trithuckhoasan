using Mydoctor.Localization;
using Volo.Abp.AspNetCore.Mvc.UI.RazorPages;

namespace Mydoctor.Web.Pages;

public abstract class MydoctorPageModel : AbpPageModel
{
    protected MydoctorPageModel()
    {
        LocalizationResourceType = typeof(MydoctorResource);
    }
}
