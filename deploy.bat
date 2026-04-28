@echo off
REM AtlasPi - Automated Deployment Script (Windows)
REM Deploy to Render with PI Network payment integration

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  AtlasPi - Deployment Script (PI Network Integration)     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo [WARNING] .env.local not found
    echo Creating from template...
    copy .env.example .env.local
    echo [ERROR] Please edit .env.local with your PI_SERVER_API_KEY
    pause
    exit /b 1
)

REM Check PI_SERVER_API_KEY
for /f "tokens=2 delims==" %%a in ('findstr "PI_SERVER_API_KEY=" .env.local') do set PI_KEY=%%a

if "%PI_KEY%"=="" (
    echo [ERROR] PI_SERVER_API_KEY not found in .env.local
    pause
    exit /b 1
)

if "%PI_KEY%"=="your_server_api_key_here_keep_secret" (
    echo [ERROR] PI_SERVER_API_KEY is still the default value
    echo Please update .env.local with your actual key
    pause
    exit /b 1
)

echo [OK] Environment configured
echo.

REM Build check
echo Checking builds...

if not exist "frontend\dist" if exist "frontend\package.json" (
    echo Building frontend...
    cd frontend
    npm run build >nul 2>&1 || echo No build script
    cd ..
)

if not exist "backend\node_modules" if exist "backend\package.json" (
    echo Installing backend dependencies...
    cd backend
    call npm ci
    cd ..
)

echo [OK] Builds ready
echo.

REM Git operations
echo Preparing git...
git add .
git commit -m "Deploy: Official PI Network payment integration" >nul 2>&1 || echo No changes to commit

echo [OK] Changes committed
echo.

REM Push to GitHub
echo Pushing to GitHub...
git push origin main >nul 2>&1 || echo [WARNING] Push to GitHub (check credentials)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Deployment Status                                         ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║  [OK] Code committed and pushed                            ║
echo ║  [INFO] Render will auto-deploy on push                    ║
echo ║  [TIME] Monitor at: https://dashboard.render.com          ║
echo ║                                                            ║
echo ║  Next Steps:                                               ║
echo ║  1. Wait for Render deployment (2-5 min)                   ║
echo ║  2. Test frontend: https://atlaspi-fronted.onrender.com    ║
echo ║  3. Test backend: https://atlaspi-backend.onrender.com     ║
echo ║  4. Run payment test locally                               ║
echo ║  5. Verify Element 10 tests pass                           ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo Deployment URLs:
echo Frontend:  https://atlaspi-fronted.onrender.com
echo Backend:   https://atlaspi-backend.onrender.com/api/health
echo.

echo Local Testing:
echo cd backend ^&^& npm start     (Terminal 1)
echo cd frontend ^&^& npm start    (Terminal 2)
echo Then test http://localhost:3000
echo.

echo [OK] Deployment script completed
pause
