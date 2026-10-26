@echo off
cd /d "%~dp0"
echo D?marrage du frontend AtlasPi sur http://localhost:3000...
npx serve -l 3000 .
pause
