@echo off
echo ===================================================
echo Starting Satark Saathi Production Server
echo AI Scam Prevention & Family Protection Platform
echo Powered by IBM Bob / watsonx Granite-13B
echo ===================================================
cd /d "%~dp0"
call .\backend\venv\Scripts\activate.bat
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
pause
