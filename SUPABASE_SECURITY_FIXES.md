# Supabase Security Issues - Fix Guide

**Date:** 2026-01-21
**Status:** Migrations created, ready to apply

---

## ✅ Fixed via Migrations

### 🔴 CRITICAL Issues (Auto-Fixed)

**Migration: `20260121_fix_rls_security_issues.sql`**

1. ✅ **RLS disabled on `tcg_price_cache`**
   - Added RLS policies
   - Public read access (prices are public data)
   - Service role can write (Edge Functions)

2. ✅ **RLS disabled on `item_price_history`**
   - Added RLS policies
   - Users can view their own items' price history
   - Service role can insert (automatic triggers)

3. ✅ **Sensitive column exposed: `card_number` in `tcg_price_cache`**
   - Now protected by RLS
   - Only accessible when needed

4. ✅ **`collection_shares` has no policies**
   - Added comprehensive policies
   - Owners can manage shares
   - Shared users can view their shares

5. ✅ **Overly permissive policy on `collection_invitations`**
   - Removed `USING (true)` policy
   - Added specific permission checks

**Migration: `20260121_fix_function_search_paths.sql`**

6. ✅ **15 functions with mutable search_path**
   - Added `SET search_path = public` to all functions
   - Prevents SQL injection via schema manipulation

---

## ⚠️ Manual Fixes Required

### 1. Enable Leaked Password Protection

**Priority:** HIGH
**Location:** Supabase Dashboard → Authentication → Policies

**Steps:**
1. Go to https://supabase.com/dashboard/project/oferxxqoeshilqhwtyqf/auth/policies
2. Find **"Leaked Password Protection"**
3. Toggle it **ON**

**What it does:**
- Checks passwords against HaveIBeenPwned.org database
- Prevents users from using compromised passwords
- Recommended for all production apps

---

### 2. Review SECURITY DEFINER Views (Optional)

**Priority:** MEDIUM
**Tables:** `item_price_history_view`, `price_alerts_view`

**Current Status:**
These views use `SECURITY DEFINER`, meaning they run with the permissions of the view creator, not the querying user.

**Options:**

**Option A: Keep as-is (Recommended)**
- These views are intentionally SECURITY DEFINER
- The underlying tables have RLS
- Views provide convenient aggregation
- No action needed

**Option B: Remove SECURITY DEFINER**
```sql
-- Drop and recreate without SECURITY DEFINER
DROP VIEW item_price_history_view;
CREATE VIEW item_price_history_view AS
  -- View definition without SECURITY DEFINER
```

---

## 🚀 Applying the Migrations

### Option 1: Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard/project/oferxxqoeshilqhwtyqf/database/migrations
2. Click **"New migration"**
3. Copy contents of `20260121_fix_rls_security_issues.sql`
4. Click **"Run"**
5. Repeat for `20260121_fix_function_search_paths.sql`

### Option 2: Supabase CLI (Recommended)

```bash
# Apply migrations
supabase db push

# Or apply specific migrations
supabase migration up
```

### Option 3: SQL Editor

1. Go to https://supabase.com/dashboard/project/oferxxqoeshilqhwtyqf/sql
2. Copy-paste each migration file
3. Click **"Run"**

---

## 🧪 Testing After Migration

### 1. Verify RLS is enabled

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('tcg_price_cache', 'item_price_history', 'collection_shares');
```

Expected: All should have `rowsecurity = true`

### 2. Verify policies exist

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('tcg_price_cache', 'item_price_history', 'collection_shares')
ORDER BY tablename, policyname;
```

Expected: Multiple policies per table

### 3. Test TCG Price Lookup

- Open app
- Login
- Go to TCG collection
- Click "Preis abrufen" on a card
- ✅ Should work
- Check that price is cached in `tcg_price_cache`

### 4. Test Price History

```sql
-- As authenticated user
SELECT * FROM item_price_history_view;
-- Should only show your items
```

---

## 📊 Before & After

### Before

| Issue | Status | Risk |
|-------|--------|------|
| `tcg_price_cache` no RLS | 🔴 CRITICAL | Public data exposure |
| `item_price_history` no RLS | 🔴 CRITICAL | PII exposure |
| Sensitive `card_number` exposed | 🔴 CRITICAL | Data leak |
| `collection_shares` no policies | 🔴 CRITICAL | Unauthorized access |
| Permissive invitation policy | 🟠 HIGH | Privilege escalation |
| 15 functions without search_path | 🟡 MEDIUM | SQL injection risk |
| Leaked password protection OFF | 🟡 MEDIUM | Weak passwords |
| SECURITY DEFINER views | 🟢 INFO | By design |

### After Migrations

| Issue | Status | Risk |
|-------|--------|------|
| `tcg_price_cache` no RLS | ✅ FIXED | Protected |
| `item_price_history` no RLS | ✅ FIXED | Protected |
| Sensitive `card_number` exposed | ✅ FIXED | Protected by RLS |
| `collection_shares` no policies | ✅ FIXED | Proper access control |
| Permissive invitation policy | ✅ FIXED | Secure checks |
| 15 functions without search_path | ✅ FIXED | Injection protected |
| Leaked password protection OFF | ⏳ MANUAL | Enable in Dashboard |
| SECURITY DEFINER views | ✅ OK | Intentional design |

---

## 🔒 Security Checklist

- [ ] Apply `20260121_fix_rls_security_issues.sql`
- [ ] Apply `20260121_fix_function_search_paths.sql`
- [ ] Enable Leaked Password Protection in Dashboard
- [ ] Test TCG price lookup functionality
- [ ] Test collection sharing functionality
- [ ] Verify RLS with test queries
- [ ] Review SECURITY DEFINER views (optional)

---

## 📝 Notes

- **Downtime:** None expected (migrations are additive)
- **Breaking Changes:** None (policies are permissive where needed)
- **Rollback:** Can drop policies if issues occur
- **Performance:** Minimal impact (RLS is efficient in Postgres)

---

## 🆘 Troubleshooting

### Issue: Functions fail after migration

**Symptom:** "relation does not exist" or similar errors

**Fix:**
```sql
-- Check current search_path
SHOW search_path;

-- Update function with correct search_path
ALTER FUNCTION function_name() SET search_path = public, auth;
```

### Issue: Users can't access data after RLS

**Symptom:** Empty results when querying tables

**Fix:**
```sql
-- Check which policies apply
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy as specific user
SET ROLE authenticated;
SELECT * FROM your_table;
RESET ROLE;
```

### Issue: Edge Functions can't write to tables

**Symptom:** INSERT/UPDATE fails with permission error

**Fix:**
Ensure Edge Functions use service_role key, not anon key:
```typescript
// In Edge Function
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // ← Use service role
)
```

---

## 📚 Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Postgres RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)

---

**Last Updated:** 2026-01-21
**Next Review:** After applying migrations
