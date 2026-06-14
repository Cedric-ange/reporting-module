Write-Host "Installation des dépendances du module de reporting..." -ForegroundColor Green

# Backend
Write-Host "Installation des dépendances backend..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de l'installation backend" -ForegroundColor Red
    Read-Host -Prompt "Appuyez sur Entrée pour quitter"
    exit 1
}
Set-Location ..

# Frontend
Write-Host "Installation des dépendances frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de l'installation frontend" -ForegroundColor Red
    Read-Host -Prompt "Appuyez sur Entrée pour quitter"
    exit 1
}
Set-Location ..

Write-Host "Installation terminée avec succès!" -ForegroundColor Green
Read-Host -Prompt "Appuyez sur Entrée pour continuer"
