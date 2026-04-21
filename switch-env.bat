@echo off
REM ============================================================================
REM AtlasPi Environment Switcher (Windows)
REM ============================================================================
REM Script to switch between different environment configurations
REM Usage: switch-env.bat <mode>
REM   - demo              : Local development (default)
REM   - pirc2-sandbox     : Pi Network sandbox testing
REM   - pirc2-production  : Production with real Pi Network
REM ============================================================================

setlocal enabledelayedexpansion
set MODE=%1
if "%MODE%"=="" set MODE=demo

set BACKEND_DIR=%~dp0backend

REM Validate mode
if not "%MODE%"=="demo" (
  if not "%MODE%"=="pirc2-sandbox" (
    if not "%MODE%"=="pirc2-production" (
      echo.
      echo ❌ Invalid mode: %MODE%
      echo Valid modes: demo, pirc2-sandbox, pirc2-production
      echo.
      exit /b 1
    )
  )
)

REM Check if mode-specific env file exists
if not exist "%BACKEND_DIR%\.env.%MODE%" (
  echo.
  echo ❌ Environment file not found: %BACKEND_DIR%\.env.%MODE%
  echo.
  exit /b 1
)

REM Backup current .env if it exists
if exist "%BACKEND_DIR%\.env" (
  for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
  for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
  set BACKUP_FILE=%BACKEND_DIR%\.env.backup.!mydate!_!mytime!
  copy "%BACKEND_DIR%\.env" "!BACKUP_FILE!" >nul
  echo ✓ Backed up previous .env to: !BACKUP_FILE!
)

REM Copy mode-specific env to .env
copy "%BACKEND_DIR%\.env.%MODE%" "%BACKEND_DIR%\.env" >nul
echo ✓ Switched to mode: %MODE%
echo ✓ Created .env from .env.%MODE%

REM Display configuration info
echo.
echo ========================================================
if "%MODE%"=="demo" (
  echo Mode: DEMO ^(Local Development^)
  echo Description: No real Pi integration, all flows are mocked
  echo Use: Development, testing, demo presentations
) else if "%MODE%"=="pirc2-sandbox" (
  echo Mode: PIRC2 SANDBOX ^(Integration Testing^)
  echo Description: Testing with Pi Network sandbox
  echo Note: Requires placeholder credential setup
  echo Status: Awaiting real sandbox credentials from Pi Network
) else if "%MODE%"=="pirc2-production" (
  echo Mode: PIRC2 PRODUCTION ^(Live^)
  echo Description: Production deployment with real Pi Network
  echo ⚠️  WARNING: Requires real production credentials
  echo ⚠️  DO NOT USE IN PRODUCTION WITHOUT PROPER SETUP
)
echo ========================================================
echo.
echo Next steps:
echo 1. Review the configuration in: %BACKEND_DIR%\.env
echo 2. Update credentials if needed
echo 3. Run: docker compose up --pull always
echo.
