Write-Host "Démarrage du module de reporting..." -ForegroundColor Green

# Backend
Write-Host "Démarrage du backend sur le port 5000..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "cmd" -ArgumentList "/k cd backend && npm run dev" -PassThru

# Attendre un peu pour le démarrage du backend
Write-Host "Attente du démarrage du backend..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Frontend
Write-Host "Démarrage du frontend sur le port 3000..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k cd frontend && npm start" -PassThru

Write-Host "Application démarrée!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter les serveurs" -ForegroundColor Yellow

# Garder le script actif
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Stop-Process -Id $backend.Id -ErrorAction SilentlyContinue
}
