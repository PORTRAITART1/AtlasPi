#!/bin/bash
# ============================================================================
# AtlasPi Environment Switcher
# ============================================================================
# Script to switch between different environment configurations
# Usage: ./switch-env.sh <mode>
#   - demo              : Local development (default)
#   - pirc2-sandbox     : Pi Network sandbox testing
#   - pirc2-production  : Production with real Pi Network
# ============================================================================

set -e

MODE=${1:-demo}
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backend"

# Validate mode
if [[ ! "$MODE" =~ ^(demo|pirc2-sandbox|pirc2-production)$ ]]; then
  echo "❌ Invalid mode: $MODE"
  echo "Valid modes: demo, pirc2-sandbox, pirc2-production"
  exit 1
fi

# Check if mode-specific env file exists
if [ ! -f "$BACKEND_DIR/.env.$MODE" ]; then
  echo "❌ Environment file not found: $BACKEND_DIR/.env.$MODE"
  exit 1
fi

# Backup current .env if it exists
if [ -f "$BACKEND_DIR/.env" ]; then
  BACKUP_FILE="$BACKEND_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
  cp "$BACKEND_DIR/.env" "$BACKUP_FILE"
  echo "✓ Backed up previous .env to: $BACKUP_FILE"
fi

# Copy mode-specific env to .env
cp "$BACKEND_DIR/.env.$MODE" "$BACKEND_DIR/.env"
echo "✓ Switched to mode: $MODE"
echo "✓ Created .env from .env.$MODE"

# Display configuration info
echo ""
echo "════════════════════════════════════════════════════════════"
case "$MODE" in
  demo)
    echo "Mode: DEMO (Local Development)"
    echo "Description: No real Pi integration, all flows are mocked"
    echo "Use: Development, testing, demo presentations"
    ;;
  pirc2-sandbox)
    echo "Mode: PIRC2 SANDBOX (Integration Testing)"
    echo "Description: Testing with Pi Network sandbox"
    echo "Note: Requires placeholder credential setup"
    echo "Status: Awaiting real sandbox credentials from Pi Network"
    ;;
  pirc2-production)
    echo "Mode: PIRC2 PRODUCTION (Live)"
    echo "Description: Production deployment with real Pi Network"
    echo "⚠️  WARNING: Requires real production credentials"
    echo "⚠️  DO NOT USE IN PRODUCTION WITHOUT PROPER SETUP"
    ;;
esac
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Review the configuration in: $BACKEND_DIR/.env"
echo "2. Update credentials if needed"
echo "3. Run: docker compose up --pull always"
echo ""
