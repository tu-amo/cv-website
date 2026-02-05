# DNS Setup Guide for janeblog.com

## Current Situation
- `cv.janeblog.com` → Points to Cloudflare Pages (working)
- `janeblog.com` → Points to old Obsidian Publish site (needs to be replaced)

## Goal
Replace the old Obsidian site with the new homepage and CV site.

## Step-by-Step DNS Configuration

### 1. Log in to Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com/
2. Select your domain: **janeblog.com**

### 2. Update DNS Records

#### Option A: Point Root Domain to Cloudflare Pages (Recommended)

**Remove old Obsidian record:**
1. Go to **DNS** → **Records**
2. Find the CNAME record pointing to `publish.obsidian.md`
3. Click **Edit** or **Delete**

**Add new CNAME for root domain:**
1. Click **Add record**
2. **Type:** CNAME
3. **Name:** `@` (this represents the root domain janeblog.com)
4. **Target:** `cv-website.pages.dev` (replace with your actual Cloudflare Pages URL)
5. **Proxy status:** ✅ Proxied (orange cloud)
6. **TTL:** Auto
7. Click **Save**

**Verify existing subdomain:**
1. Confirm `cv.janeblog.com` CNAME record exists and points to your Cloudflare Pages URL
2. **Proxy status:** ✅ Proxied (orange cloud)

### 3. Update Cloudflare Pages Settings

1. Go to **Workers & Pages**
2. Click on your **cv-website** project (or whatever it's named)
3. Go to **Settings** → **Custom domains**
4. Add custom domains:
   - `janeblog.com`
   - `www.janeblog.com`
   - `cv.janeblog.com` (should already be there)
5. Click **Set up a custom domain** for each
6. Cloudflare will automatically configure the DNS

### 4. Verify DNS Propagation

Wait 5-10 minutes, then test:

```bash
# Check root domain
dig janeblog.com

# Check www subdomain
dig www.janeblog.com

# Check CV subdomain
dig cv.janeblog.com
```

All should point to Cloudflare Pages.

### 5. Test in Browser

1. Visit: https://janeblog.com/ → Should show new homepage
2. Visit: https://www.janeblog.com/ → Should redirect to janeblog.com
3. Visit: https://cv.janeblog.com/ → Should show CV page
4. Visit: https://janeblog.com/cv → Should show CV page
5. Visit: https://janeblog.com/architecture → Should show architecture demo

## Expected DNS Records After Setup

| Type | Name | Target | Proxy | Purpose |
|------|------|--------|-------|---------|
| CNAME | @ | cv-website.pages.dev | ✅ Proxied | Root domain |
| CNAME | www | cv-website.pages.dev | ✅ Proxied | WWW subdomain |
| CNAME | cv | cv-website.pages.dev | ✅ Proxied | CV subdomain |

## Troubleshooting

### Issue: "This site can't be reached"
- **Cause:** DNS not propagated yet
- **Solution:** Wait 10-15 minutes and clear browser cache

### Issue: Still seeing Obsidian site
- **Cause:** Browser cache or DNS cache
- **Solution:** 
  - Clear browser cache (Cmd+Shift+R on Mac)
  - Flush DNS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`

### Issue: PageSpeed Insights still failing
- **Cause:** Old cached version
- **Solution:** Wait for Cloudflare cache to clear (up to 30 minutes)

## Verification Checklist

- [ ] Old Obsidian DNS record removed
- [ ] New CNAME for @ pointing to Cloudflare Pages
- [ ] Custom domains added in Cloudflare Pages settings
- [ ] janeblog.com loads new homepage
- [ ] www.janeblog.com redirects to janeblog.com
- [ ] cv.janeblog.com still works
- [ ] /cv and /architecture routes work
- [ ] PageSpeed Insights passes for all URLs

## Next Steps After DNS is Live

1. Run PageSpeed Insights on https://janeblog.com/
2. Verify all Core Web Vitals are green
3. Continue with Phase 2: Accessibility Enhancements
4. Add structured data (Person schema)
5. Create sitemap.xml
