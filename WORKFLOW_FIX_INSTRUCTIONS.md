# Workflow Configuration Fix

## Problem

The Replit workflow is configured to run `npm run dev`, which only starts the Vite client server (port 5173). However, ClubRank requires both the Express backend AND Vite frontend to run together on port 5000.

## Solution

The development server has been fixed via `server/dev.ts`, which combines Express + Vite middleware on port 5000. However, the workflow needs to be updated to run this new dev server.

## Manual Configuration Required

Since the system prevents programmatic editing of `package.json` and `.replit`, **one of these changes must be made manually**:

### Option 1: Update package.json (Recommended)

Edit `package.json` and change the `dev` script:

```json
{
  "scripts": {
    "dev": "tsx server/dev.ts",
    "build": "...",
    "start": "..."
  }
}
```

### Option 2: Update .replit Workflow

Edit `.replit` and change the workflow task:

```
[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npx tsx server/dev.ts"
waitForPort = 5000
```

### Option 3: Use Shell Script (Temporary)

Run the development server manually:

```bash
./dev.sh
```

Or:

```bash
npx tsx server/dev.ts
```

## How to Verify

After making the change:

1. Click "Run" or restart the workflow
2. Wait for console message: "🚀 Dev server running on http://localhost:5000"
3. Check that both backend and frontend work:
   - Backend: `curl http://localhost:5000/api/health`
   - Frontend: Open browser to see the ClubRank app

## Technical Details

**server/dev.ts** does the following:
1. Creates Express server with all API routes
2. Adds Vite middleware for HMR (Hot Module Replacement)
3. Serves frontend files during development
4. Listens on port 5000 (matches workflow expectation)

This matches the production architecture where Express serves the built client files, but adds Vite's development features like instant refresh.

## Troubleshooting

**Port 5000 already in use:**
```bash
killall node
npx tsx server/dev.ts
```

**TSX not found:**
```bash
npm install tsx
npx tsx server/dev.ts
```

**Vite not starting:**
- Check that `vite.config.ts` exists
- Verify Vite is in `package.json` dependencies
- Check console logs for specific error messages
