# Собирает и поднимает приложение + PostgreSQL в Docker.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Checking Docker..." -ForegroundColor Cyan
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker не запущен. Запустите Docker Desktop и повторите."
}

Write-Host "Building and starting Career Daily (app + postgres)..." -ForegroundColor Cyan
docker compose up -d --build

Write-Host ""
Write-Host "Готово:" -ForegroundColor Green
Write-Host "  Игра:  http://localhost:8080"
Write-Host "  Логин: admin / admin"
Write-Host ""
Write-Host "Логи приложения: docker compose logs -f app"
Write-Host "Остановить:      docker compose down"
