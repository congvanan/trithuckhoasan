# Start all backend services for local development
$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\src\Mydoctor.AuthServer'; dotnet run" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\src\Mydoctor.HttpApi.Host'; dotnet run" -WindowStyle Normal

Write-Host "Started AuthServer (44391) and HttpApi.Host (44322)" -ForegroundColor Green
