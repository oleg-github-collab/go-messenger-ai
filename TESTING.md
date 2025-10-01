# Testing Guide - Kaminskyi AI Messenger

## 🔍 What Was Fixed

### Authentication Issues Resolved:
1. ✅ **Cookie-based authentication** - Server now sets HTTP-only cookies
2. ✅ **Dual auth support** - Both cookies AND Bearer tokens work
3. ✅ **Detailed logging** - Every auth attempt is logged with [AUTH], [LOGIN] tags
4. ✅ **Proper redirects** - After login, correctly redirects to home page
5. ✅ **Session management** - Tokens stored both in cookie and localStorage

### Key Changes:

#### Backend (main.go):
- Cookie is set on successful login with `HttpOnly`, `Secure`, and `SameSite` flags
- Auth middleware checks cookie first, then Bearer token
- Detailed logging for every request: `[AUTH]`, `[LOGIN]`, `[LOGOUT]`
- New `/logout` endpoint to properly clear sessions

#### Frontend:
- `login.js` - Uses `credentials: 'include'` to send cookies
- `home.js` - Added cookie support for API calls
- Console logging for debugging in browser DevTools

## 🧪 Testing Steps

### 1. Deploy to Railway

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger"
git add .
git commit -m "Fix authentication with cookie support and detailed logging"
git push
```

### 2. Check Railway Logs

After deployment, you should see:
```
🚀 Kaminskyi AI Messenger starting on :8080
📝 Login credentials: username=Oleh, password=QwertY24$
🔒 Authentication: Cookie-based + Bearer token
```

### 3. Test Login Flow

**Open:** `https://your-app.railway.app/login`

1. Open Browser DevTools (F12)
2. Go to Console tab
3. Enter credentials:
   - Username: `Oleh`
   - Password: `QwertY24$`
4. Click "Sign In"

**Expected Console Output:**
```
Login attempt: Oleh
Login response status: 200
Login response data: {success: true, token: "..."}
Token stored, redirecting to home...
```

**Expected Railway Logs:**
```
[LOGIN] POST request from 192.168.x.x
[LOGIN] Received body: {"username":"Oleh","password":"QwertY24$"}
[LOGIN] Attempting login for user: Oleh
[LOGIN] ✅ Login successful for user: Oleh, token: AbCdEf1234...
[AUTH] Request: GET /
[AUTH] Valid cookie token for: /
```

### 4. Verify Home Page

**After redirect, you should see:**
- "1-on-1 Meetings" header
- "Create Meeting" button
- Your profile avatar with "Oleh"
- "Logout" button

**Browser DevTools → Application → Cookies:**
You should see cookie `auth_token` with your token

### 5. Test Create Meeting

1. Click "Create Meeting"
2. Watch console for: `Creating meeting, token exists: true`
3. Should navigate to: `https://your-app.railway.app/room/[uuid]`

**Expected Railway Logs:**
```
[AUTH] Request: GET /create
[AUTH] Valid cookie token for: /create
[CREATE] Creating room...
[AUTH] Request: GET /room/abc-123-def
[AUTH] Valid cookie token for: /room/abc-123-def
```

### 6. Test Logout

1. Click "Logout" button
2. Confirm logout
3. Should redirect to `/login`

**Expected Railway Logs:**
```
[LOGOUT] User logging out
[LOGOUT] Removed session token
```

## 🐛 Debugging

### If Login Still Fails:

1. **Check Railway Logs** for the exact error:
   ```bash
   railway logs --follow
   ```

2. **Look for these log lines:**
   - `[LOGIN] POST request from...` - Login attempt
   - `[LOGIN] Received body: {...}` - Credentials received
   - `[LOGIN] ✅ Login successful` - Success
   - `[LOGIN] ❌ Invalid credentials` - Wrong username/password

3. **Check Browser Console:**
   - Open DevTools (F12) → Console
   - Look for login.js logs
   - Check for any errors

4. **Check Cookies:**
   - DevTools → Application → Cookies
   - Should see `auth_token` after login
   - If not, check if `Secure` flag requires HTTPS

### Common Issues:

**Issue:** Cookie not being set
**Solution:** Ensure Railway URL is HTTPS (it should be by default)

**Issue:** Redirect loop (login → home → login)
**Solution:** Check Railway logs for `[AUTH]` messages to see why auth fails

**Issue:** "Invalid credentials" despite correct password
**Solution:** Check Railway logs for `[LOGIN] Received body:` to verify credentials are sent correctly

## 📊 Expected Log Flow for Successful Login:

```
[LOGIN] POST request from 23.45.67.89
[LOGIN] Received body: {"username":"Oleh","password":"QwertY24$"}
[LOGIN] Attempting login for user: Oleh
[LOGIN] ✅ Login successful for user: Oleh, token: VGhpc0lzQV...
[AUTH] Request: GET /
[AUTH] Valid cookie token for: /
```

## 🔐 Security Features:

- ✅ HttpOnly cookies (JavaScript can't access)
- ✅ Secure flag (HTTPS only on production)
- ✅ SameSite Lax (CSRF protection)
- ✅ 24-hour token expiration
- ✅ Server-side session validation

## 📱 Test on Multiple Devices:

1. **Desktop Chrome:** Should work perfectly
2. **Desktop Safari:** Should work perfectly
3. **Mobile Safari (iOS):** Should work perfectly
4. **Mobile Chrome (Android):** Should work perfectly

## ✅ Success Criteria:

- [ ] Can login with Oleh / QwertY24$
- [ ] After login, see home page (not redirected back to login)
- [ ] Can create meeting room
- [ ] Can access room URL
- [ ] Can logout successfully
- [ ] Railway logs show detailed [AUTH] and [LOGIN] messages

---

**If everything works:** You should see detailed logs in Railway and smooth authentication flow! 🎉
