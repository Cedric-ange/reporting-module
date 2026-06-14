cd C:\Users\angec\reporting-module\frontend
npm install react react-dom react-router-dom react-scripts axios xlsx date-fns @mui/material @mui/icons-material @emotion/react @emotion/styled
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation des dependances frontend
    pause
    exit /b 1
)
echo Installation frontend reussie
pause