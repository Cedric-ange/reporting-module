@echo off
echo ========================================
echo Lancement Application Reporting Commercial
echo ========================================
echo.

echo [1/3] Verification dependances backend...
cd backend
if not exist node_modules (
    echo Installation des dependances backend...
    call npm install express cors multer xlsx body-parser better-sqlite3
) else (
    echo Dependances backend deja installees
)
echo.

echo [2/3] Demarrage du backend (port 5000)...
start "Backend Server" cmd /k "npm run dev"
timeout /t 5 /nobreak > nul
echo Backend demarre sur http://
echo.

echo [3/3] Verification dependances frontend...
cd ..\frontend
if not exist node_modules (
    echo Installation des dependances frontend...
    call npm install react react-dom react-router-dom react-scripts axios xlsx date-fns @mui/material @mui/icons-material @emotion/react @emotion/styled
) else (
    echo Dependances frontend deja installees
)
echo.

echo Demarrage du frontend (port 3000)...
start "Frontend App" cmd /k "npm start"
echo.

echo ========================================
echo Application en cours de demarrage...
echo ========================================
echo.
echo Backend: http://
echo Frontend: http://localhost:3000
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause