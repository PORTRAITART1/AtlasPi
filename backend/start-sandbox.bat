@echo off
cd /d "%~dp0.."
echo D?marrage du backend AtlasPi en mode Sandbox...
node --env-file=backend/.env.sandbox backend/server.js
pause
