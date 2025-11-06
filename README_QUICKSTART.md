# ClubRank - Quick Start Guide

## ✅ MVP Complete!

All ClubRank features are ready for deployment. Your app now has:

- ✅ Club-only features (all personal matching removed)
- ✅ CP (Club Power) ranking system (no more "ELO" terminology)
- ✅ Simplified club analytics
- ✅ Railway deployment configuration
- ✅ Fixed development environment

## 🚀 How to Run the App

### One-Time Setup

Edit `package.json` and change line 7:

**From:**
```json
"dev": "cd client && npm run dev",
```

**To:**
```json
"dev": "tsx server/dev.ts",
```

### Start Development Server

After making the change above, just click the **Run** button!

The server will start on port 5000 with both:
- Backend API (Express)
- Frontend (React + Vite)

### If You Can't Edit package.json

Run this command manually:
```bash
npx tsx server/dev.ts
```

## 📝 What Changed?

### Removed Features
- Personal player matching
- Individual rankings
- Partner compatibility

### Updated Features
- All "ELO" changed to "CP" (Club Power)
- Club analytics simplified to show only inter-club matches
- Firebase credentials now optional during development

### New Files
- `server/dev.ts` - Unified development server
- `FINAL_MVP_STATUS.md` - Complete status report
- `DEPLOYMENT.md` - Railway deployment guide

## 🔧 Troubleshooting

**"Port 5000 not opening"**
→ Make sure you updated package.json (see above)

**"Firebase error on startup"**
→ This is normal! Firebase is optional during development. Add credentials later for full auth features.

**"Can't see changes in browser"**
→ Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## 🚢 Deploy to Production

See `DEPLOYMENT.md` for complete Railway deployment instructions.

Quick version:
1. Push code to GitHub
2. Connect Railway to your repo
3. Add Firebase environment variables in Railway dashboard
4. Deploy!

## 📚 More Information

- **Full Status**: See `FINAL_MVP_STATUS.md`
- **Development Setup**: See `DEV_SETUP.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Project Overview**: See `replit.md`

---

**Need help?** All documentation is in the root directory.
