#!/usr/bin/env pwsh
# =============================================================================
# Taskify Demo Reset Script
# =============================================================================
# Tears down all containers, wipes the database volume, reverts all source
# file changes, removes untracked files (agent container), and restarts
# the baseline environment.
# =============================================================================

Write-Host "`n🔄 Resetting Taskify demo environment..." -ForegroundColor Cyan

# Stop containers and remove volumes
Write-Host "  → Stopping containers and wiping database..." -ForegroundColor Yellow
docker compose down -v 2>$null

# Revert all modified tracked files
Write-Host "  → Reverting source files to baseline..." -ForegroundColor Yellow
git checkout .

# Remove untracked files/folders (apps/agent/, sql/002_*, etc.) but keep .github prompts
Write-Host "  → Removing untracked files..." -ForegroundColor Yellow
git clean -fd -e .github/

# Rebuild and start baseline
Write-Host "  → Rebuilding baseline environment..." -ForegroundColor Yellow
docker compose up --build -d

# Wait for health
Write-Host "  → Waiting for services to be healthy..." -ForegroundColor Yellow
$retries = 15
while ($retries -gt 0) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 2 -ErrorAction Stop
        if ($response.status -eq "ok") {
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
    $retries--
}

if ($retries -eq 0) {
    Write-Host "`n❌ Services did not become healthy in time." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Demo environment reset and ready!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   API:      http://localhost:3000" -ForegroundColor White
Write-Host ""
