# Troubleshooting: Vercel Not Auto-Deploying from GitHub

## Problem
Vercel is not automatically detecting and deploying new commits pushed to GitHub, even though:
- The repository is connected to Vercel
- Commits are being pushed to the correct branch
- Other projects (like `vibey-nines`, `vibey-looper`, `vibey-cats`) work fine

## Root Cause: Commit Author Email Mismatch

Vercel uses the GitHub App integration to detect commits. When a commit is pushed, Vercel checks:
1. **Does the commit author's email match a GitHub account?**
2. **Is that GitHub account associated with a Vercel account?**

If the commit author email doesn't match any GitHub account, Vercel will show an error:
> "No GitHub account was found matching the commit author email address"

This prevents automatic deployments from triggering.

## How to Diagnose

### 1. Check GitHub Commit Status
- Go to your GitHub repository
- View a recent commit
- Look for Vercel check status
- If you see "No GitHub account was found matching the commit author email address", this is the issue

### 2. Check Your Git Config
```bash
# Check local (project-specific) config
git config user.email

# Check global config
git config --global user.email

# Check recent commit author emails
git log --format="%an <%ae>" -5
```

### 3. Check Your GitHub Account Emails
- Go to GitHub → Settings → Emails
- Note your primary email and verified emails
- These are the emails Vercel will recognize

## Solution

### Step 1: Identify the Correct Email
- Use your **primary GitHub email** (from GitHub Settings → Emails)
- Or use a GitHub no-reply email: `username@users.noreply.github.com`

### Step 2: Update Git Config

**For this project only (local config):**
```bash
git config --local user.email "your-github-email@example.com"
git config --local user.name "Your Name"
```

**For all projects (global config):**
```bash
git config --global user.email "your-github-email@example.com"
git config --global user.name "Your Name"
```

**Recommended:** Set both local AND global to ensure consistency.

### Step 3: Fix Recent Commits (Optional)

If you want to fix the author email on recent commits:

**For the last commit:**
```bash
git commit --amend --reset-author --no-edit
git push --force-with-lease origin main
```

**For multiple commits:** Use interactive rebase (more complex, be careful)

### Step 4: Verify

1. Make a test commit:
   ```bash
   # Make a small change
   git add .
   git commit -m "Test: Verify Vercel auto-deployment"
   git push origin main
   ```

2. Check the commit author:
   ```bash
   git log -1 --format="%an <%ae>"
   ```
   Should show your GitHub email.

3. Check Vercel:
   - Go to Vercel dashboard
   - Should see a new deployment starting automatically
   - Check GitHub commit page - Vercel check should pass (not show email error)

## Why Some Projects Work and Others Don't

Different projects can have different git configurations:

1. **Local git config per project**: Each repository can override global settings
   - If `vibey-nines` has local config with correct email → works
   - If `vibey-liner-notez` has local config with wrong email → doesn't work

2. **When projects were created**: 
   - Projects created when global config had correct email → all commits have correct email
   - Projects created when global config had wrong email → all commits have wrong email

3. **Mixed commit authors**: Some projects might have commits with different emails

**To check why a project works:**
```bash
cd /path/to/working-project
git config user.email
git log --format="%ae" -5
```

## Prevention

### Best Practice: Set Both Local and Global Config

```bash
# Set global (affects all projects)
git config --global user.email "your-github-email@example.com"
git config --global user.name "Your Name"

# For specific projects that need different email, set local
cd /path/to/project
git config --local user.email "project-specific-email@example.com"
```

### Verify Before First Commit in New Projects

```bash
# Check what email will be used
git config user.email

# If wrong, fix it before committing
git config user.email "correct-email@example.com"
```

## Related Issues

### Build Fails After Fixing Email
If Vercel now detects commits but build fails:
- Check for missing dependencies in `package.json`
- Ensure all imports have corresponding dependencies listed
- Check build logs in Vercel dashboard

### Example: Missing @vercel/analytics
If you import `@vercel/analytics/react` but it's not in `package.json`:
```bash
npm install @vercel/analytics
# This adds it to package.json
```

## Summary

**The Issue:** Commit author email doesn't match GitHub account → Vercel can't authenticate → No auto-deployment

**The Fix:** Update git config to use GitHub-verified email → Future commits work → Vercel auto-deploys

**Prevention:** Always verify git config email matches your GitHub account before committing in new projects.

