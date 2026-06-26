# Создаёт пользователя и БД devsimulator в локальном PostgreSQL (Windows).
# Нужен пароль суперпользователя postgres (задавался при установке PG).

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$psqlCandidates = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files\PostgreSQL\12\bin\psql.exe",
    "C:\Program Files\PostgreSQL\11\bin\psql.exe",
    "C:\Program Files\PostgreSQL\10\bin\psql.exe"
)

$psql = $psqlCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $psql) {
    Write-Error "psql.exe не найден. Установите PostgreSQL или укажите путь вручную."
}

Write-Host "Используется: $psql" -ForegroundColor Cyan
Write-Host ""
Write-Host "На порту 5432 уже работает PostgreSQL (не Docker)." -ForegroundColor Yellow
Write-Host "Введите пароль пользователя postgres (Enter — если пароль пустой):" -ForegroundColor Yellow

$secure = Read-Host "Пароль postgres" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

if ($plain) { $env:PGPASSWORD = $plain }

$sqlFile = Join-Path $PSScriptRoot "create-db.sql"

Write-Host "Создаю пользователя devsimulator и базу devsimulator..." -ForegroundColor Cyan

& $psql -U postgres -h localhost -p 5432 -f $sqlFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Если пользователь уже существует — это нормально. Проверка подключения..." -ForegroundColor Yellow
}

$env:PGPASSWORD = "devsimulator"
& $psql -U devsimulator -h localhost -p 5432 -d devsimulator -c "SELECT current_database(), current_user;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Готово. Запускайте приложение с профилем postgres:" -ForegroundColor Green
    Write-Host "  VM options: -Dspring.profiles.active=postgres" -ForegroundColor Green
    Write-Host "  или в IntelliJ: Run -> Edit Configurations -> Active profiles: postgres" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Не удалось подключиться как devsimulator/devsimulator." -ForegroundColor Red
    Write-Host "Пока можно запускать без PostgreSQL — профиль dev (H2) включён по умолчанию." -ForegroundColor Yellow
}

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
