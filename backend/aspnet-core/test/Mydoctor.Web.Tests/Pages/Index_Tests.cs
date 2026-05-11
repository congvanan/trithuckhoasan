using System.Threading.Tasks;
using Shouldly;
using Xunit;

namespace Mydoctor.Pages;

public class Index_Tests : MydoctorWebTestBase
{
    [Fact]
    public async Task Welcome_Page()
    {
        var response = await GetResponseAsStringAsync("/");
        response.ShouldNotBeNull();
    }
}
