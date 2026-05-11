namespace Mydoctor.Ai;

public enum AiJobStatus : byte
{
    Pending = 0,
    Running = 1,
    Completed = 2,
    Failed = 3,
    Cancelled = 4
}
