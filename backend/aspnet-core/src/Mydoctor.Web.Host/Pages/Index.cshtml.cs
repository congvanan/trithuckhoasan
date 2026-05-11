using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;

namespace Mydoctor.Web.Pages;

public class IndexModel : MydoctorPageModel
{
    public void OnGet()
    {

    }

    public async Task OnPostLoginAsync()
    {
        await HttpContext.ChallengeAsync("oidc");
    }
}
