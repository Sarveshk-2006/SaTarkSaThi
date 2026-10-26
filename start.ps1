# ===================================================
# Starting Satark Saathi Production Server
# AI Scam Prevention & Family Protection Platform
# Default engine: local deterministic rules (IBM watsonx.ai optional, off unless configured)
# ===================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Satark Saathi (सतर्क साथी) Deployment Launcher" -ForegroundColor Green
Write-Host " Host: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host " API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host " Analysis engine: local rule engine (IBM watsonx.ai only if configured)" -ForegroundColor Magenta
Write-Host "===================================================" -ForegroundColor Cyan

& ".\backend\venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
