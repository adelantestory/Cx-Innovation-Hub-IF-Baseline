#!/usr/bin/env pwsh
# =============================================================================
# Taskify Demo Reset Script
# =============================================================================
# Tears down all containers, wipes the database volume, and switches back
# to the baseline branch (deleting the working branch if on one).
#
# Workflow:
#   1. git checkout -b demo/task-decomposition   ← create a working branch
#   2. Run the implement-task-decomposition prompt
#   3. ./reset-demo.ps1                          ← tear down and delete branch
# =============================================================================

param(
    [string]$Branch = ""
)

Write-Host "`n🔄 Resetting Taskify demo environment..." -ForegroundColor Cyan

# Stop containers and remove volumes
Write-Host "  → Stopping containers and wiping database..." -ForegroundColor Yellow
docker compose down -v 2>$null

# Determine current and baseline branch
$currentBranch = git rev-parse --abbrev-ref HEAD
$baseBranch = "demo/ui-development"
$branchToDelete = if ($Branch) { $Branch } else { $currentBranch }

if ($branchToDelete -eq $baseBranch) {
    Write-Host "  → Already on baseline branch ($baseBranch). Nothing to reset." -ForegroundColor Yellow
} else {
    Write-Host "  → Switching to baseline branch ($baseBranch)..." -ForegroundColor Yellow
    git checkout $baseBranch
    Write-Host "  → Deleting working branch ($branchToDelete)..." -ForegroundColor Yellow
    git branch -D $branchToDelete
}

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
Write-Host "   To re-run the demo:" -ForegroundColor Gray
Write-Host "     git checkout -b demo/task-decomposition" -ForegroundColor Gray
Write-Host "     # Then invoke the implement-task-decomposition prompt" -ForegroundColor Gray
Write-Host ""
