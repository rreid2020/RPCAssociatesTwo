# Fix: Build Command for Combined Server

## The Problem

The deployment fails because when you run `cd api/server && npm start`, the `api/server/node_modules` directory doesn't exist. The build command only builds the frontend and copies `dist`, but doesn't install the API server's dependencies.

## The Solution

Update your **Build Command** in Digital Ocean to:

```
npm run build && cp -r dist api/server/dist && cd api/server && npm install
```

This will:
1. Build the frontend (`npm run build`)
2. Copy `dist` to `api/server/dist`
3. Install API server dependencies (`cd api/server && npm install`)

## Updated Configuration

**Build Command:**
```
npm run build && cp -r dist api/server/dist && cd api/server && npm install
```

**Run Command:**
```
cd api/server && npm start
```

**HTTP Port:**
```
3000
```

**Health Check:**
```
/api/health
```

## Why This Works

- The build command installs all dependencies needed for the API server
- When the run command executes `cd api/server && npm start`, all dependencies are already installed
- The server can start successfully and serve both frontend and API
