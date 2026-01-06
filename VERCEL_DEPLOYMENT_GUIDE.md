# Vercel Deployment Guide

## Current Status

✅ **Ready for Deployment**

Your app is already configured for Vercel:
- ✅ `vercel.json` exists with SPA routing
- ✅ Build script configured (`npm run build`)
- ✅ Build output directory set (`dist`)
- ✅ Vite framework detected

---

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign up or log in (use GitHub account for easy integration)

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import from GitHub (connect your GitHub account if needed)
   - Select your repository: `vibey-liner-notez`

3. **Configure Project**
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

4. **Environment Variables** (if needed)
   - Currently: None required (all APIs are public)
   - If you add API keys later, add them here

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~1-2 minutes)
   - Your app will be live at: `https://your-project-name.vercel.app`

---

### Option 2: Deploy via Vercel CLI (For Developers)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   - First time: Follow prompts to link project
   - Production: `vercel --prod`

4. **Your app will be live at**: `https://your-project-name.vercel.app`

---

## What Happens During Deployment

1. **Vercel detects** your Vite + React app
2. **Runs** `npm install` to install dependencies
3. **Runs** `npm run build` to build your app
4. **Deploys** the `dist` folder to Vercel's CDN
5. **Configures** SPA routing (from `vercel.json`)
6. **Provides** HTTPS automatically
7. **Assigns** a domain: `your-project.vercel.app`

---

## Current Configuration

### `vercel.json` (Already Configured)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**What this does**:
- ✅ Tells Vercel to use Vite framework
- ✅ Builds to `dist` directory
- ✅ Routes all requests to `index.html` (SPA routing)
- ✅ Enables browser back/forward buttons to work

---

## Post-Deployment Checklist

### ✅ Verify These Work

1. **Homepage loads**: https://your-project.vercel.app
2. **Search works**: Try searching for "David Bowie"
3. **Album details load**: Click on an album
4. **Browser back button works**: Navigate and use back button
5. **Help section works**: Click Help link
6. **Gallery works**: View album art gallery
7. **Wikipedia content loads**: Check album detail page

### ✅ Test These Features

- [ ] Search by artist only
- [ ] Search by artist + album
- [ ] Filter by release type (Studio Albums, EPs, Singles, etc.)
- [ ] Sort options (Newest, Oldest, A-Z, Z-A)
- [ ] Hide bootlegs filter
- [ ] Pagination (Previous/Next)
- [ ] Album detail page loads
- [ ] Album art gallery expands
- [ ] Wikipedia content displays
- [ ] Browser back button navigation
- [ ] Help section opens/closes

---

## Custom Domain (Optional)

If you want a custom domain:

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Domains
   - Add your domain (e.g., `linernotez.com`)
   - Follow DNS configuration instructions

2. **DNS Configuration**:
   - Add CNAME record pointing to Vercel
   - Vercel will provide SSL certificate automatically

---

## Environment Variables (If Needed Later)

If you add API keys or secrets later:

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Environment Variables
   - Add variables (e.g., `VITE_API_KEY=your-key`)
   - Redeploy for changes to take effect

2. **In Code**:
   - Access via: `import.meta.env.VITE_API_KEY`
   - Note: Must prefix with `VITE_` for Vite to expose it

---

## Continuous Deployment

### Automatic Deployments

Once connected to GitHub:
- ✅ **Push to `main` branch** → Auto-deploys to production
- ✅ **Push to other branches** → Creates preview deployment
- ✅ **Pull requests** → Creates preview deployment

### Manual Deployments

- Use Vercel CLI: `vercel --prod`
- Or trigger from Vercel Dashboard

---

## Troubleshooting

### Build Fails

1. **Check build logs** in Vercel Dashboard
2. **Test locally**: `npm run build`
3. **Common issues**:
   - Missing dependencies → Check `package.json`
   - Build errors → Check console output
   - TypeScript errors → Fix type issues

### App Doesn't Load

1. **Check routing**: Verify `vercel.json` rewrites are correct
2. **Check build output**: Ensure `dist` folder has `index.html`
3. **Check console**: Browser DevTools for errors

### API Calls Fail

1. **Check CORS**: External APIs (MusicBrainz, Wikipedia) should allow Vercel domain
2. **Check HTTPS**: All API calls use HTTPS (already configured)
3. **Check rate limiting**: MusicBrainz has 1 req/sec limit

---

## Performance Optimization (Already Done)

Your app already has:
- ✅ Code splitting (Vite handles this)
- ✅ Asset optimization (Vite minifies)
- ✅ CDN delivery (Vercel provides)
- ✅ HTTPS (Vercel provides)
- ✅ Gzip compression (Vercel provides)

---

## Security (Already Configured)

- ✅ HTTPS enforced (Vercel automatic)
- ✅ No API keys exposed (all APIs are public)
- ✅ React XSS protection (built-in)
- ✅ Input encoding (`encodeURIComponent`)

**Optional Enhancements** (from security review):
- Add CSP headers (can add to `vercel.json`)
- Add HSTS headers (Vercel handles this)

---

## Next Steps

1. **Deploy to Vercel** (follow Option 1 or 2 above)
2. **Test the live site** (use checklist above)
3. **Share the URL** with users
4. **Monitor** for any issues

---

## Quick Start Command

If you have Vercel CLI installed:

```bash
# One command to deploy
vercel --prod
```

That's it! Your app will be live in ~1-2 minutes.

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev
- **Your Project**: Check Vercel Dashboard for logs and analytics

