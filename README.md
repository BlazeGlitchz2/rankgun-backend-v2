# RankGun Backend — Vercel Serverless (c) BL4ZE

This is a minimal serverless backend for Vercel.

## Endpoints
- `POST /api/rank`   — promote a user to a new **roleId** using Roblox Open Cloud (cloud v2)
- `GET  /api/health` — health check

## Environment Variables (Vercel → Project → Settings → Environment Variables)
- `ROBLOX_OPEN_CLOUD_KEY` **(required)** — your Open Cloud API key, scoped to your **Group** with permission to **manage roles**.
- `SHARED_SECRET` **(recommended)** — a long random string. You must also send this value from Roblox in header `x-rg-shared`.
- `OPEN_CLOUD_BASE` *(optional)* — defaults to `https://apis.roblox.com`.

## Request to /api/rank
Headers:
```
Content-Type: application/json
x-rg-shared: <YOUR_SHARED_SECRET>   # if you set one
```
Body JSON:
```json
{
  "groupId": 1234567,
  "targetUserId": 987654321,
  "newRoleId": 112233,
  "reason": "Promotion (c) BL4ZE"
}
```
Notes:
- `newRoleId` is the **role Id**, not the rank number. Use `GroupService:GetRolesAsync(groupId)` to see role Ids.
- The user must already be in the group.
- The key owner must have permission to change roles in that group.

## Deploy
Place this folder at your repo **root**:
```
/api/rank.js
/api/health.js
package.json
README.md
```
Connect repo to Vercel → add env vars → Deploy.
Your URL will be `https://<your-app>.vercel.app/api/rank`.

## Roblox wiring
In `ReplicatedStorage/RankGunConfig` (ModuleScript):
```lua
return {
  GROUP_ID = 0000000,  -- your numeric group id
  MIN_HR_RANK = 200,   -- your HR start rank
  BACKEND_URL = "https://<your-app>.vercel.app/api/rank",
  SIGNING_KEY_ID = "rk1",
  USE_HMAC = false
}
```
In `ServerScriptService/RankGun.server.lua`, inside sendBackend headers:
```lua
headers["x-rg-shared"] = "YOUR_SHARED_SECRET"
```
