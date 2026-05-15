# Start backend HttpApi.Host cho local development
# Lưu ý: AuthServer (44391) hiện không cần — Next.js dùng HttpApi.Host (44322) làm cả OIDC server lẫn API server.
# Khi nào scale ra Blazor / mobile mới cần thêm: dotnet run --project src/Mydoctor.AuthServer
$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\src\Mydoctor.HttpApi.Host'; dotnet run" -WindowStyle Normal

Write-Host "Started HttpApi.Host (https://localhost:44322)" -ForegroundColor Green
Write-Host "Frontend: chay 'pnpm dev' trong thu muc frontend/" -ForegroundColor Cyan
