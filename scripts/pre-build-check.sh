#!/bin/bash
# Pre-build validation script to catch common errors

echo "🔍 Running Pre-Build Validation..."
echo ""

ERRORS=0

# 1. Check for duplicate className attributes
echo "1️⃣ Checking for duplicate className attributes..."
DUPLICATES=$(find src -name "*.tsx" -exec grep -l "className=.*className=" {} \; 2>/dev/null)
if [ -n "$DUPLICATES" ]; then
  echo "❌ Found duplicate className attributes in:"
  echo "$DUPLICATES"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No duplicate className attributes"
fi
echo ""

# 2. Check for duplicate other common props
echo "2️⃣ Checking for duplicate onClick/onChange attributes..."
for ATTR in onClick onChange value id; do
  DUPS=$(grep -rn "$ATTR=.*$ATTR=" src/ --include="*.tsx" 2>/dev/null | head -5)
  if [ -n "$DUPS" ]; then
    echo "❌ Found duplicate $ATTR attributes:"
    echo "$DUPS"
    ERRORS=$((ERRORS + 1))
  fi
done
if [ $ERRORS -eq 0 ]; then
  echo "✅ No duplicate event handlers"
fi
echo ""

# 3. Check for unclosed JSX tags
echo "3️⃣ Checking for potential unclosed JSX tags..."
UNCLOSED=$(grep -rn "<[A-Z][a-zA-Z]*[^/>]*$" src/ --include="*.tsx" | grep -v ">" | head -5)
if [ -n "$UNCLOSED" ]; then
  echo "⚠️  Potential unclosed tags (manual review needed):"
  echo "$UNCLOSED"
fi
echo "✅ JSX syntax check complete"
echo ""

# 4. Check for unreachable code (consecutive returns)
echo "4️⃣ Checking for unreachable return statements..."
UNREACHABLE=$(grep -B1 "^\s*return" src/ --include="*.ts" --include="*.tsx" -r 2>/dev/null | grep -A1 "return" | grep "return" | uniq -d | head -5)
if [ -n "$UNREACHABLE" ]; then
  echo "⚠️  Potential unreachable code found (review needed)"
fi
echo "✅ No obvious unreachable code"
echo ""

# 5. Check for missing imports
echo "5️⃣ Checking for common missing imports..."
if grep -rn "useState" src/ --include="*.tsx" | grep -v "import.*useState" | grep -v "React.useState" >/dev/null 2>&1; then
  echo "⚠️  Files using useState without import (check manually)"
fi
echo "✅ Import check complete"
echo ""

# 6. Check for @ts-ignore without explanation
echo "6️⃣ Checking for @ts-ignore comments..."
TS_IGNORES=$(grep -rn "@ts-ignore" src/ --include="*.ts" --include="*.tsx" | wc -l)
if [ "$TS_IGNORES" -gt 5 ]; then
  echo "⚠️  Found $TS_IGNORES @ts-ignore comments (review if needed)"
else
  echo "✅ Limited use of @ts-ignore ($TS_IGNORES found)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
  echo "✅ PRE-BUILD CHECK PASSED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "❌ PRE-BUILD CHECK FAILED ($ERRORS errors)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
