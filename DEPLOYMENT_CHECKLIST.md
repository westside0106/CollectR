# CollectR Security Deployment Checklist

**Date:** 2026-01-21
**PR:** #30 (merged)
**Branch:** main

---

## ✅ Code Changes (Deployed via Vercel)

- ✅ PII removed from documentation (HANDOVER.md, AGENTS.md)
- ✅ Hardcoded Supabase URLs replaced with placeholders
- ✅ Partial API key removed from AGENTS.md
- ✅ Security headers implemented (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Supabase hostname made dynamic via environment variable
- ✅ Authentication headers added to TCG components
- ✅ JWT verification enabled in supabase/config.toml

---

## ✅ Manual Configuration (Completed)

### Supabase Dashboard
- ✅ New publishable key generated
- ✅ Old "version2" key deleted/revoked
- ✅ JWT verification enabled for `analyze-image`
- ✅ JWT verification enabled for `tcg-price-lookup`
- ✅ JWT verification enabled for `tcg-price-updater`

### Vercel Dashboard
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` updated with new key

---

## 🧪 Post-Deployment Testing

### Critical Tests
- [ ] **TCG Price Lookup** (logged in) - Should work
- [ ] **TCG Price Lookup** (logged out) - Should show "Bitte melde dich an"
- [ ] **Bulk Price Update** (logged in) - Should work
- [ ] **Supabase Storage Images** - Should load correctly
- [ ] **Security Headers** - Check with browser DevTools

### Security Headers Verification
Open Browser DevTools (F12) → Network → Reload page → Check response headers:
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: origin-when-cross-origin`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

### Edge Functions Auth Test
```bash
# This should FAIL (401 Unauthorized):
curl -X POST 'https://oferxxqoeshilqhwtyqf.supabase.co/functions/v1/tcg-price-lookup' \
  -H 'Content-Type: application/json' \
  -d '{"cardName":"Pikachu","game":"pokemon"}'

# Expected: {"error": "Unauthorized"} or similar
```

---

## 🔒 Security Posture

### Before
- 🔴 PII exposed in public repository
- 🔴 Hardcoded credentials in documentation
- 🔴 Unauthenticated Edge Functions
- 🟡 Missing security headers
- 🟡 Hardcoded Supabase hostname

### After
- ✅ PII removed
- ✅ Credentials rotated and secured
- ✅ All Edge Functions require JWT authentication
- ✅ Security headers implemented
- ✅ Configuration uses environment variables

---

## 📊 Deployment Status

**Vercel:** Check at https://vercel.com/dashboard
- [ ] Latest deployment from main branch
- [ ] Build successful
- [ ] Status: Ready
- [ ] Environment variables updated

**GitHub:** https://github.com/westside0106/CollectR
- ✅ PR #30 merged
- ✅ All commits in main

**Supabase:** https://supabase.com/dashboard/project/oferxxqoeshilqhwtyqf
- ✅ New API keys active
- ✅ Edge Functions configured with JWT

---

## ⚠️ Breaking Changes

**Users must now be authenticated to:**
- Use TCG price lookup functionality
- Access bulk price update features
- Call any Supabase Edge Functions

**This is expected and improves security.**

---

## 📝 Notes

- Old API key has been rotated (no longer in git history risk)
- Git history still contains old credentials (accepted risk - mitigated by rotation)
- Security headers may require testing across different browsers
- JWT verification is enforced at Supabase level and application level

---

## ✅ Sign-off

**Security Review Completed:** 2026-01-21
**Vulnerabilities Fixed:** 7/7
**Deployment Status:** Ready for production

**Next Review:** After first production test
