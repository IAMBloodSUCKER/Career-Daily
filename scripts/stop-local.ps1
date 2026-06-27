# Останавливает процессы, запущенные scripts/start-local.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$pidFile = Join-Path $Root "data\local-dev.pids"

if (-not (Test-Path $pidFile)) {
    Write-Host "Файл data\local-dev.pids не найден — возможно, сервисы не запускались через start-local.ps1." -ForegroundColor Yellow
    exit 0
}

Get-Content $pidFile | ForEach-Object {
    if ($_ -match '^(\w+)=(\d+)$') {
        $name = $Matches[1]
        $processId = [int]$Matches[2]
        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $processId -Force
            Write-Host "Остановлен $name (PID $processId)" -ForegroundColor Green
        } else {
            Write-Host "$name (PID $processId) уже не работает" -ForegroundColor DarkGray
        }
    }
}

Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
Write-Host "Готово." -ForegroundColor Cyan
