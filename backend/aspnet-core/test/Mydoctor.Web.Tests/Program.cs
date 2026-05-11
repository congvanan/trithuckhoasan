using Microsoft.AspNetCore.Builder;
using Mydoctor;
using Volo.Abp.AspNetCore.TestBase;

var builder = WebApplication.CreateBuilder();

builder.Environment.ContentRootPath = GetWebProjectContentRootPathHelper.Get("Mydoctor.Web.csproj");
await builder.RunAbpModuleAsync<MydoctorWebTestModule>(applicationName: "Mydoctor.Web" );

public partial class Program
{
}
