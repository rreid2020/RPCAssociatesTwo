# Git Repository Setup Guide

## Step 1: Initialize Local Git Repository

Run these commands in your project directory:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: RPC Associates website"
```

## Step 2: Create GitHub Repository

1. **Go to GitHub:**
   - Visit https://github.com
   - Sign in or create an account

2. **Create a new repository:**
   - Click the "+" icon in the top right
   - Select "New repository"
   - Repository name: `rpc-associates` (or your preferred name)
   - Description: "RPC Associates marketing website"
   - Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

3. **Copy the repository URL:**
   - GitHub will show you commands
   - Copy the HTTPS URL (looks like: `https://github.com/yourusername/rpc-associates.git`)

## Step 3: Connect and Push to GitHub

Run these commands (replace the URL with your actual repository URL):

```bash
# Add GitHub as remote
git remote add origin https://github.com/yourusername/rpc-associates.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Verify

1. Go to your GitHub repository page
2. You should see all your files
3. Your code is now on GitHub and ready for Digital Ocean App Platform!

## Next Steps

Once your code is on GitHub, you can:
1. Go to Digital Ocean App Platform
2. Connect your GitHub repository
3. Deploy!

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Initialize and commit (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repo and push in one command
gh repo create rpc-associates --public --source=. --remote=origin --push
```

