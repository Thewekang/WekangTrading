#!/bin/bash
# Check if there are duplicate columns (camelCase vs snake_case)

export PATH=$HOME/.turso:$PATH

echo "🔍 Checking all columns in sop_types table..."
echo ""

turso db shell wekangtrading-prod "SELECT name FROM pragma_table_info('sop_types') ORDER BY cid;"

echo ""
echo "Looking for duplicate columns:"
echo "  - detailImagesShort vs detail_images_short"
echo "  - detailImagesLong vs detail_images_long"
echo "  - detailImageNotesShort vs detail_image_notes_short"
echo "  - detailImageNotesLong vs detail_image_notes_long"
