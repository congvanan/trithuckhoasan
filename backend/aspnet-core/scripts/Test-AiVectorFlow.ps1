param(
    [string]$ConnectionString = "Host=localhost;Port=6543;Database=Mydoctor;Username=postgres;Password=Ancv@12345",
    [string]$SourceId,
    [string]$SourceName,
    [int]$Top = 10,
    [switch]$IncludeChunkText
)

$ErrorActionPreference = "Stop"

$project = Join-Path $PSScriptRoot "AiVectorInspector\\AiVectorInspector.csproj"
if (-not (Test-Path $project)) {
    throw "Khong tim thay project inspector: $project"
}

$arguments = @(
    "run"
    "--project"
    $project
    "--"
    "--connection-string"
    $ConnectionString
    "--top"
    $Top
)

if ($SourceId) {
    $arguments += @("--source-id", $SourceId)
}

if ($SourceName) {
    $arguments += @("--source-name", $SourceName)
}

if ($IncludeChunkText) {
    $arguments += "--include-chunk-text"
}

& dotnet @arguments
exit $LASTEXITCODE
