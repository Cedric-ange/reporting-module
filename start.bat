@echo off
echo Démarrage du module de reporting...
echo.
echo Démarrage du backend (port 5000)...
start cmd /k "cd backend && npm run dev"
echo.
echo Attente du démarrage du backend...
timeout /t 5
echo.
echo Démarrage du frontend (port 3000)...
start cmd /k "cd frontend && npm start"
echo.
echo Application démarrée!
echo Frontend: http://localhost:3000
echo Backend: http://
echo.
pause
