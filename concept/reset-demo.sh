#!/usr/bin/env bash
# =============================================================================
# Taskify Demo Reset Script
# =============================================================================
# Tears down all containers, wipes the database volume, reverts all source
# file changes, removes untracked files (agent container), and restarts
# the baseline environment.
# =============================================================================

set -e

echo ""
echo "🔄 Resetting Taskify demo environment..."

# Stop containers and remove volumes
echo "  → Stopping containers and wiping database..."
docker compose down -v 2>/dev/null || true

# Revert all modified tracked files
echo "  → Reverting source files to baseline..."
git checkout .

# Remove untracked files/folders (apps/agent/, sql/002_*, etc.) but keep .github prompts
echo "  → Removing untracked files..."
git clean -fd -e .github/

# Rebuild and start baseline
echo "  → Rebuilding baseline environment..."
docker compose up --build -d

# Wait for health
echo "  → Waiting for services to be healthy..."
retries=15
until curl -sf http://localhost:3000/api/health > /dev/null 2>&1; do
  retries=$((retries - 1))
  if [ $retries -le 0 ]; then
    echo ""
    echo "❌ Services did not become healthy in time."
    exit 1
  fi
  sleep 2
done

echo ""
echo "✅ Demo environment reset and ready!"
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:3000"
echo ""
