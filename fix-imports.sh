#!/bin/bash
set -e

# Scan all .astro files
find src -name "*.astro" | while read -r file; do
  dir=$(dirname "$file")

  # Look for imports like ../components/X or ./components/X
  grep -o "['\"]\.\./*components/[^'\"]*['\"]" "$file" | while read -r match; do
    # Extract component file
    comp=$(echo "$match" | sed "s#['\"]##g" | sed "s#.*/components/##")
    
    # Compute correct relative path
    correct=$(realpath --relative-to="$dir" "src/components/$comp")
    
    # Normalize for Windows Git Bash
    correct=${correct//\\//}
    
    echo "Fixing $file → $match → $correct"
    
    # Replace in file
    sed -i "s#${match}#'${correct}'#g" "$file"
  done
done

echo "✅ Import paths fixed"
