# 🚨 URGENT: Add Redis to Railway

## Problem
Your app is crashing because **Redis service is not added** to Railway project.

```
[REDIS] ❌ Failed to connect: dial tcp [::1]:6379: connect: connection refused
```

## Solution (2 minutes)

### Step 1: Add Redis Service

1. **Go to your Railway project:** https://railway.app/project/your-project-id
2. **Click:** "+ New" button
3. **Select:** "Database"
4. **Click:** "Add Redis"
5. **Wait:** ~30 seconds for Redis to provision

### Step 2: Verify REDIS_URL

1. **Click on your Go service** (not Redis)
2. **Go to:** "Variables" tab
3. **Check:** `REDIS_URL` variable should appear automatically
4. **Example:** `redis://default:password@containers-us-west-123.railway.app:6379`

### Step 3: Redeploy (Automatic)

Railway will **automatically redeploy** your app because:
- I just pushed a fix to GitHub
- Railway is connected to your GitHub repo
- New commit triggers automatic deployment

**Wait 2-3 minutes and check logs again.**

---

## What the Fix Does

The new code I just pushed:

✅ **Validates** `REDIS_URL` is set (shows helpful error if not)
✅ **Retries** connection 5 times with 2s delay
✅ **Shows** clear Railway setup instructions in logs
✅ **Masks** sensitive parts of Redis URL in logs

---

## Expected Logs After Fix

### If Redis NOT added yet:
```
[REDIS] ❌ REDIS_URL environment variable not set!
[REDIS] 💡 Please add Redis service in Railway dashboard:
[REDIS] 💡 1. Click '+ New' → Database → Add Redis
[REDIS] 💡 2. Railway will automatically set REDIS_URL
[REDIS] 💡 3. Redeploy your application
```

### If Redis added correctly:
```
[REDIS] 🔗 Connecting to Redis...
[REDIS] 📍 URL: redis://***@containers-us-west-123.railway.app:6379
[REDIS] ✅ Connected successfully
[DAILY] ✅ Daily.co client initialized
[TRANSCRIPT] ✅ Transcript processor initialized
[POLLING] 🚀 Starting recording poller (interval: 5m0s)
🌐 Server: :8080
```

---

## Still Not Working?

### Check 1: Redis Service Status
- Go to Railway project
- Click on Redis service
- Should show green "Active" status

### Check 2: REDIS_URL Variable
- Click on Go service
- Go to Variables tab
- Look for `REDIS_URL` (auto-set by Railway)
- Should look like: `redis://default:password@host:6379`

### Check 3: Services in Same Project
- Both services (Go app + Redis) must be in **same Railway project**
- If not, delete and recreate Redis in correct project

### Check 4: Manual Redeploy
If automatic redeploy didn't happen:
- Go to Deployments tab
- Click "Deploy" button

---

## Quick Checklist

- [ ] Redis service added to Railway project
- [ ] Redis shows "Active" status (green)
- [ ] `REDIS_URL` appears in Variables tab of Go service
- [ ] Latest deployment is running (after my fix)
- [ ] Logs show `[REDIS] ✅ Connected successfully`

---

## After Redis Works

You'll see in logs:
```
[REDIS] ✅ Connected successfully
[DAILY] ✅ Daily.co client initialized
[TRANSCRIPT] ✅ Transcript processor initialized
[POLLING] ✅ Recording polling service started (5 min interval)
[POLLING] 🔍 Checking for new recordings...
🚀 Kaminskyi AI Messenger v1.0
🌐 Server: :8080
```

**Then your app is fully working! 🎉**

---

## Summary

**What happened:**
- You deployed the app before adding Redis service
- App tried to connect to localhost Redis (doesn't exist on Railway)
- App crashed

**What to do:**
1. ✅ Add Redis service (2 clicks)
2. ✅ Wait for auto-redeploy (~2 min)
3. ✅ Check logs

**That's it!** Redis is the only missing piece.
