# Сброс локальной H2-базы (dev). Удаляет ./data/devsimulator.*
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$files = Get-ChildItem -Path ".\data" -Filter "devsimulator*" -ErrorAction SilentlyContinue
if (-not $files) {
    Write-Host "Файлы data/devsimulator* не найдены — нечего удалять." -ForegroundColor Yellow
    exit 0
}

$files | Remove-Item -Force
Write-Host "Локальная H2-база удалена. Запустите приложение снова — Flyway создаст схему заново." -ForegroundColor Green
