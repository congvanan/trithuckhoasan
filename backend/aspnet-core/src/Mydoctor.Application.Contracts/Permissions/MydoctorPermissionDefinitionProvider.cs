using Mydoctor.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace Mydoctor.Permissions;

public class MydoctorPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(MydoctorPermissions.GroupName, L("Permission:Mydoctor"));

        var aiGroup = myGroup.AddPermission(MydoctorPermissions.Ai.Default, L("Permission:Ai"));

        var sources = aiGroup.AddChild(MydoctorPermissions.Ai.Sources.Default, L("Permission:Ai.Sources"));
        sources.AddChild(MydoctorPermissions.Ai.Sources.Create, L("Permission:Ai.Sources.Create"));
        sources.AddChild(MydoctorPermissions.Ai.Sources.Edit, L("Permission:Ai.Sources.Edit"));
        sources.AddChild(MydoctorPermissions.Ai.Sources.Delete, L("Permission:Ai.Sources.Delete"));
        sources.AddChild(MydoctorPermissions.Ai.Sources.Reindex, L("Permission:Ai.Sources.Reindex"));

        var settings = aiGroup.AddChild(MydoctorPermissions.Ai.Settings.Default, L("Permission:Ai.Settings"));
        settings.AddChild(MydoctorPermissions.Ai.Settings.Edit, L("Permission:Ai.Settings.Edit"));

        var logs = aiGroup.AddChild(MydoctorPermissions.Ai.Logs.Default, L("Permission:Ai.Logs"));
        logs.AddChild(MydoctorPermissions.Ai.Logs.Export, L("Permission:Ai.Logs.Export"));
        logs.AddChild(MydoctorPermissions.Ai.Logs.Delete, L("Permission:Ai.Logs.Delete"));

        var jobs = aiGroup.AddChild(MydoctorPermissions.Ai.Jobs.Default, L("Permission:Ai.Jobs"));
        jobs.AddChild(MydoctorPermissions.Ai.Jobs.Cancel, L("Permission:Ai.Jobs.Cancel"));
        jobs.AddChild(MydoctorPermissions.Ai.Jobs.Delete, L("Permission:Ai.Jobs.Delete"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<MydoctorResource>(name);
    }
}
