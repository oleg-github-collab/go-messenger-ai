# ✅ Deployment Checklist - Railway

## Pre-Deployment

### 1. Code Ready
- [x] All bugs fixed (mode parameters, logging)
- [x] TURN server deployed (157.245.20.158)
- [x] Testing guide created
- [ ] Code pushed to GitHub

### 2. Railway Project Setup
- [ ] Railway account created
- [ ] New project created
- [ ] GitHub repo connected
- [ ] Redis added to project

---

## Railway Configuration

### Step 1: Add Redis Database

1. Click "+ New" in your Railway project
2. Select "Database" → "Redis"
3. Wait for provisioning (~30 seconds)
4. Redis will auto-generate `REDIS_URL`

✅ Verify: Check Variables tab → `REDIS_URL` should exist

### Step 2: Configure Environment Variables

Go to your service → Variables → Add these:

```bash
# TURN Server (required)
TURN_HOST=157.245.20.158
TURN_USERNAME=kaminskyi-25a04450ce8b905b
TURN_PASSWORD=Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu
```

### Step 3: Push Code

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger"
git push origin main
```

Railway should auto-deploy after push (~2-3 minutes)

---

## Post-Deployment: Test Everything

See TESTING_GUIDE.md for complete testing procedures.

**Quick test:**
1. Login: https://your-app.railway.app/login (Oleh / QwertY24$)
2. Create Meeting
3. Join as guest in incognito
4. Test video/audio

---

**Ready to deploy! 🚀**
