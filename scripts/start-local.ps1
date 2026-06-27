# Локальный запуск без Docker: H2 + gateway/auth/game + статика через http-server.
# Нужны: JDK 17+, Node.js (для npx http-server). Maven не нужен — используется mvnw.cmd.

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Test-PortFree([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return -not $conn
}

foreach ($p in @(8080, 8081, 8082, 3000)) {
    if (-not (Test-PortFree $p)) {
        Write-Error "Порт $p занят. Остановите другой процесс или docker compose down."
    }
}

Write-Host "=== Career Daily — локальный запуск (без Docker) ===" -ForegroundColor Cyan
Write-Host ""

$mvnw = Join-Path $Root "mvnw.cmd"
if (-not (Test-Path $mvnw)) {
    Write-Error "mvnw.cmd не найден в корне репозитория."
}

Write-Host "[1/3] Сборка сервисов (первый раз может занять несколько минут)..." -ForegroundColor Cyan
& $mvnw -B -q package -pl auth-service,game-service,gateway -am -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Error "Сборка Maven не удалась."
}

$authJar = Get-ChildItem "$Root\auth-service\target\auth-service-*.jar" | Where-Object { $_.Name -notmatch 'original' } | Select-Object -First 1
$gameJar = Get-ChildItem "$Root\game-service\target\game-service-*.jar" | Where-Object { $_.Name -notmatch 'original' } | Select-Object -First 1
$gwJar = Get-ChildItem "$Root\gateway\target\gateway-*.jar" | Where-Object { $_.Name -notmatch 'original' } | Select-Object -First 1

if (-not $authJar -or -not $gameJar -or -not $gwJar) {
    Write-Error "JAR-файлы не найдены после сборки."
}

Write-Host "[2/3] Запуск auth (8081), game (8082), gateway (8080)..." -ForegroundColor Cyan

$logsDir = Join-Path $Root "data\logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$authProc = Start-Process -FilePath "java" -ArgumentList @("-jar", $authJar.FullName) `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logsDir "auth.log") `
    -RedirectStandardError (Join-Path $logsDir "auth.err.log")

Start-Sleep -Seconds 3

$gameProc = Start-Process -FilePath "java" -ArgumentList @("-jar", $gameJar.FullName) `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logsDir "game.log") `
    -RedirectStandardError (Join-Path $logsDir "game.err.log")

Start-Sleep -Seconds 3

$gwProc = Start-Process -FilePath "java" -ArgumentList @("-jar", $gwJar.FullName) `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logsDir "gateway.log") `
    -RedirectStandardError (Join-Path $logsDir "gateway.err.log")

Start-Sleep -Seconds 4

Write-Host "[3/3] Статика frontend на http://localhost:3000 (прокси /api -> gateway)..." -ForegroundColor Cyan

$frontendDir = Join-Path $Root "frontend"
$pidFile = Join-Path $Root "data\local-dev.pids"

@"
auth=$($authProc.Id)
game=$($gameProc.Id)
gateway=$($gwProc.Id)
"@ | Set-Content -Encoding UTF8 $pidFile

Write-Host ""
Write-Host "Готово:" -ForegroundColor Green
Write-Host "  Игра:  http://localhost:3000" -ForegroundColor Green
Write-Host "  Логин: admin / admin" -ForegroundColor Green
Write-Host ""
Write-Host "Логи: data\logs\*.log" -ForegroundColor Yellow
Write-Host "Остановить: .\scripts\stop-local.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend работает в этом окне. Ctrl+C — только статика; сервисы остановите stop-local.ps1" -ForegroundColor Yellow
Write-Host ""

Set-Location $frontendDir
npx --yes http-server -p 3000 -P http://127.0.0.1:8080 -c-1
