# ClubRank Development Setup

## Development Environment Fix

The development environment has been updated to properly run both Express backend and Vite frontend together.

### What Changed

**Previous Setup (Broken)**:
- `npm run dev` only started Vite client on port 5173
- Express backend never started
- Workflow expected port 5000 but it never opened

**New Setup (Fixed)**:
- Created `server/dev.ts` that runs Express + Vite middleware together
- Listens on port 5000 as expected by Replit workflow
- HMR (Hot Module Replacement) still works for frontend development

### How to Run

**Development Mode:**
```bash
npx tsx server/dev.ts
```

**Production Build:**
```bash
npm run build
npm start
```

### Architecture

**Development (`server/dev.ts`)**:
- Express server with API routes on port 5000
- Vite middleware embedded for HMR
- All `/api/*` routes handled by Express
- All other routes served by Vite dev server

**Production (`server/index.ts`)**:
- Express server serves pre-built static files from `server/public/`
- No Vite, just pure Express serving the built client bundle

### Configuration Note

Due to Replit environment restrictions, the `package.json` dev script cannot be modified programmatically. The workflow configuration in `.replit` needs to be manually updated to:

```
[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npx tsx server/dev.ts"
waitForPort = 5000
```

OR the package.json dev script should be changed to:
```json
"dev": "tsx server/dev.ts"
```
