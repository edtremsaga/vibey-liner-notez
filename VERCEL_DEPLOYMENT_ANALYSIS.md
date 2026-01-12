# Vercel Auto-Deployment Issue Analysis

## Key Finding: Commit Author Email Mismatch

### Current Situation
- **Commit Author Email**: `edwardtremblay@MacBookPro.lan` (local machine email)
- **Vercel Requirement**: Commit author email must match the email associated with your Vercel account

### Why This Matters
Vercel uses the GitHub App integration (not webhooks) to detect commits. When a commit is pushed, Vercel checks:
1. Is the commit author's email associated with a Vercel account?
2. Does that Vercel account have access to the project?

If the email doesn't match, Vercel may not trigger automatic deployments.

### Comparison with Working Project
Your `vibey-nines` project works because:
- Either the commit author email matches your Vercel account email
- Or the commits were made with a different email that IS associated with your Vercel account

## Diagnostic Steps

### 1. Check Your Vercel Account Email
- Go to Vercel Dashboard → Settings → General
- Note the email address associated with your account

### 2. Check Working Project Commit Emails
Run this in your `vibey-nines` project:
```bash
git log --format="%an <%ae>" -5
```
Compare the email addresses used in working vs non-working projects.

### 3. Check Current Git Configuration
```bash
git config user.email
git config user.name
```

## Solutions

### Option 1: Update Git Config to Match Vercel Email
```bash
git config --global user.email "your-vercel-email@example.com"
git config --global user.name "Your Name"
```

Then amend the last commit:
```bash
git commit --amend --reset-author --no-edit
git push --force-with-lease origin main
```

### Option 2: Add Email to Vercel Account
If you want to keep using `edwardtremblay@MacBookPro.lan`:
- Add this email to your Vercel account settings
- Or use GitHub's email forwarding (e.g., `username@users.noreply.github.com`)

### Option 3: Check Vercel Project Settings
1. **Production Branch**: Settings → Git → Production Branch should be `main`
2. **Auto-deploy**: Ensure "Auto-deploy" is enabled
3. **Ignored Build Step**: Should be empty or not preventing deployments

### Option 4: Verify GitHub App Permissions
1. GitHub → Settings → Applications → Installed GitHub Apps → Vercel
2. Ensure `vibey-liner-notez` repository is selected
3. Permissions should include "Read and write" access

## Additional Checks

### Compare Working vs Non-Working Projects
Check these settings in both projects:

**Vercel Dashboard:**
- Project Settings → Git → Connected Repository
- Project Settings → Git → Production Branch
- Project Settings → Git → Auto-deploy enabled?

**GitHub:**
- Repository Settings → Collaborators (you should be listed)
- Repository Settings → Webhooks (even if empty, check if vibey-nines has any)

### Vercel.json Configuration
Current `vercel.json` looks correct - no `git.deploymentEnabled: false` blocking deployments.

## Next Steps
1. Identify the email used in `vibey-nines` commits
2. Compare with your Vercel account email
3. Update git config or Vercel account accordingly
4. Test with a new commit

