@echo off
REM AtlasPi Deployment Verification Script (Windows)

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  AtlasPi - Pre-Deployment Verification                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set CHECKS_PASSED=0
set CHECKS_TOTAL=0

echo Checking dependencies...

REM Check Node.js
where node >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Node.js installed
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] Node.js NOT installed
)
set /a CHECKS_TOTAL+=1

REM Check npm
where npm >nul 2>&1
if %errorlevel%==0 (
    echo [OK] npm installed
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] npm NOT installed
)
set /a CHECKS_TOTAL+=1

REM Check git
where git >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Git installed
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] Git NOT installed
)
set /a CHECKS_TOTAL+=1

echo.
echo Checking project structure...

REM Check files
if exist ".env.local" (
    echo [OK] .env.local exists
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] .env.local NOT found
)
set /a CHECKS_TOTAL+=1

if exist "package.json" (
    echo [OK] Root package.json exists
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] Root package.json NOT found
)
set /a CHECKS_TOTAL+=1

if exist "backend\package.json" (
    echo [OK] Backend package.json exists
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] Backend package.json NOT found
)
set /a CHECKS_TOTAL+=1

if exist "backend\src\services\pi-payment.ts" (
    echo [OK] Backend PI payment service exists
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] Backend PI payment service NOT found
)
set /a CHECKS_TOTAL+=1

if exist "backend\src\routes\payments.ts" (
    echo [OK] Backend payment routes exist
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] Backend payment routes NOT found
)
set /a CHECKS_TOTAL+=1

echo.
echo Checking environment configuration...

REM Check .env.local contents
findstr "PI_SERVER_API_KEY=" .env.local >nul 2>&1
if %errorlevel%==0 (
    echo [OK] PI_SERVER_API_KEY configured
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] PI_SERVER_API_KEY NOT configured
)
set /a CHECKS_TOTAL+=1

findstr "PI_APP_ID=" .env.local >nul 2>&1
if %errorlevel%==0 (
    echo [OK] PI_APP_ID configured
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] PI_APP_ID NOT configured
)
set /a CHECKS_TOTAL+=1

findstr "PI_NETWORK=testnet" .env.local >nul 2>&1
if %errorlevel%==0 (
    echo [OK] PI_NETWORK set to testnet
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] PI_NETWORK NOT set to testnet
)
set /a CHECKS_TOTAL+=1

echo.
echo Checking security...

REM Check for placeholder values
findstr "your_server_api_key" .env.local >nul 2>&1
if %errorlevel%==1 (
    echo [OK] .env.local doesn't contain placeholders
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] .env.local contains placeholder values
)
set /a CHECKS_TOTAL+=1

REM Check .gitignore
findstr ".env" .gitignore >nul 2>&1
if %errorlevel%==0 (
    echo [OK] .env files are in .gitignore
    set /a CHECKS_PASSED+=1
) else (
    echo [ERROR] .env files NOT in .gitignore
)
set /a CHECKS_TOTAL+=1

echo.
echo ╔════════════════════════════════════════════════════════════╗

if %CHECKS_PASSED%==%CHECKS_TOTAL% (
    echo ║  Status: [OK] ALL CHECKS PASSED - READY TO DEPLOY      ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo Next steps:
    echo 1. Commit changes: git add . ^&^& git commit -m "Deploy"
    echo 2. Push to GitHub: git push origin main
    echo 3. Monitor Render: https://dashboard.render.com
    echo.
    pause
    exit /b 0
) else (
    echo ║  Status: [ERROR] CHECKS FAILED - FIX BEFORE DEPLOY     ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)
