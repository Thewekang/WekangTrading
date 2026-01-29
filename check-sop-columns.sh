#!/bin/bash
# Check SOP Types table structure in production

# Add turso to PATH
export PATH=$HOME/.turso:$PATH

echo "🔍 Checking SOP Types table structure in production database..."
echo ""

turso db shell wekangtrading-prod "PRAGMA table_info(sop_types);"

echo ""
echo "Looking for these columns (added in migration 0006):"
echo "  - detail_images_short"
echo "  - detail_images_long"
echo "  - detail_image_notes_short"
echo "  - detail_image_notes_long"
echo ""
echo "If these columns are missing, migration 0006 needs to be applied."
