@echo off
echo Installation des dépendances du module de reporting...
cd backend
echo Installation backend...
call npm install
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation backend
    pause
    exit /b %errorlevel%
)
cd ..
cd frontend
echo Installation frontend...
call npm install
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation frontend
    pause
    exit /b %errorlevel%
)
cd ..
echo Installation terminée avec succès
pause
