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
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Ошибка Docker (часто TLS timeout к registry-1.docker.io)." -ForegroundColor Red
    Write-Host "  VPN / зеркало в Docker Desktop, или .\scripts\start-local.ps1" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Готово:" -ForegroundColor Green
Write-Host "  Игра:  http://localhost:3000"
Write-Host "  API:   http://localhost:8080"
Write-Host "  Логин: admin / admin"
Write-Host ""
Write-Host "Логи: docker compose logs -f"
Write-Host "Стоп: docker compose down"
