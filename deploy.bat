@echo off
REM deploy.bat - convenience wrapper to run deploy.ps1
SET SCRIPT_DIR=%~dp0
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%deploy.ps1" %*
