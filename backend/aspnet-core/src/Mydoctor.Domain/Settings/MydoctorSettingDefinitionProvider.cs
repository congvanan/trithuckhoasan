using Volo.Abp.Settings;

namespace Mydoctor.Settings;

public class MydoctorSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        //Define your own settings here. Example:
        //context.Add(new SettingDefinition(MydoctorSettings.MySetting1));
    }
}
