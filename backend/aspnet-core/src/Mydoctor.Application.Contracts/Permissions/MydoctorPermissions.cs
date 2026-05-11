namespace Mydoctor.Permissions;

public static class MydoctorPermissions
{
    public const string GroupName = "Mydoctor";

    public static class Ai
    {
        public const string Default = GroupName + ".Ai";

        public static class Sources
        {
            public const string Default = GroupName + ".Ai.Sources";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Reindex = Default + ".Reindex";
        }

        public static class Settings
        {
            public const string Default = GroupName + ".Ai.Settings";
            public const string Edit = Default + ".Edit";
        }

        public static class Logs
        {
            public const string Default = GroupName + ".Ai.Logs";
            public const string Export = Default + ".Export";
            public const string Delete = Default + ".Delete";
        }

        public static class Jobs
        {
            public const string Default = GroupName + ".Ai.Jobs";
            public const string Cancel = Default + ".Cancel";
            public const string Delete = Default + ".Delete";
        }
    }
}
