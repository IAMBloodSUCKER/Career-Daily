# Поднимает PostgreSQL в Docker. Если контейнер уже запущен — использует его.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Checking Docker..." -ForegroundColor Cyan
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker не запущен. Запустите Docker Desktop и повторите."
}

Write-Host "Starting PostgreSQL (docker compose up -d postgres)..." -ForegroundColor Cyan
docker compose up -d postgres

Write-Host "Waiting for database..." -ForegroundColor Cyan
$attempts = 0
while ($attempts -lt 30) {
    $health = docker inspect --format='{{.State.Health.Status}}' career-daily-db 2>$null
    if ($health -eq "healthy") {
        Write-Host "PostgreSQL ready on localhost:5433 (db: devsimulator)" -ForegroundColor Green
        exit 0
    }
    Start-Sleep -Seconds 2
    $attempts++
}

Write-Host "Container started; healthcheck still pending. Try: mvn spring-boot:run" -ForegroundColor Yellow
