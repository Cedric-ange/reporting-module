Write-Host "Installation des dépendances backend..." -ForegroundColor Green
Set-Location backend
npm install
if ($LASTEXITCODE -neq 0) {
    Write-Host "Erreur lors de l'installation backend" -ForegroundColor Red
    Read-Host -Prompt "Appuyez sur Entrée pour quitter"
    exit 1
}
Write-Host "Installation backend terminée!" -ForegroundColor Green
Read-Host -Prompt "Appuyez sur Entrée pour continuer"
