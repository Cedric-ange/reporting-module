cd C:\Users\angec\reporting-module\backend
npm install express cors multer xlsx body-parser sqlite3
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation des dependances backend
    pause
    exit /b 1
)
echo Installation backend reussie
pause