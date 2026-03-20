using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;

namespace MyAbpApp.Web.Pages;

public class IndexModel : MyAbpAppPageModel
{
    public void OnGet()
    {

    }

    public async Task OnPostLoginAsync()
    {
        await HttpContext.ChallengeAsync("oidc");
    }
}
