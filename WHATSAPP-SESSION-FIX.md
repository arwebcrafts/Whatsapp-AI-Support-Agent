# WhatsApp Session Persistence Fix

## Problem

Previously, WhatsApp authentication sessions were stored in the file system (`whatsapp_sessions/` directory). This caused users to be disconnected and forced to rescan QR codes whenever:
- New code was deployed to Railway/production
- The server restarted
- The container was recreated

This happened because Railway and most cloud platforms use **ephemeral file systems** that are wiped on each deployment.

## Solution

We've migrated WhatsApp authentication storage from the file system to the database. The authentication state (credentials and encryption keys) is now stored in the `sessionData` field of the `WhatsAppConnection` model.

### Key Changes:

1. **Created `lib/database-auth-state.ts`**
   - Implements database-backed authentication state for Baileys
   - Stores `creds.json` and encryption keys in MySQL/Postgres
   - Provides `useDatabaseAuthState()` and `clearDatabaseAuthState()` functions

2. **Updated `lib/whatsapp-service-fixed.ts`**
   - Removed file system dependency (no more `whatsapp_sessions/` directory)
   - Uses `useDatabaseAuthState` instead of `useMultiFileAuthState`
   - All session checks now query the database instead of file system

3. **Schema Already Ready**
   - The `WhatsAppConnection.sessionData` field (Json type) was already present in the schema
   - No database migration required!

## Benefits

✅ **Sessions persist across deployments** - Users stay connected when you push updates
✅ **No more QR code rescanning** - Authentication survives server restarts
✅ **Railway-compatible** - Works perfectly with ephemeral file systems
✅ **Scalable** - Multiple instances can share the same database
✅ **Reliable** - Database is the single source of truth

## How It Works

### Before (File-Based):
```
1. User scans QR code
2. Baileys saves creds.json to whatsapp_sessions/{agentId}/
3. Deploy happens → File system wiped
4. Session lost → User must rescan QR code
```

### After (Database-Based):
```
1. User scans QR code
2. Baileys saves creds to database (sessionData field)
3. Deploy happens → Database persists
4. Server restarts → Automatically reconnects using database creds
5. ✅ User stays connected!
```

## For Developers

### No Changes Required

The migration is automatic. Existing installations will:
- Continue working normally
- Start storing new sessions in the database
- Old file-based sessions will not be migrated (users will need to reconnect once)

### Testing Locally

To verify session persistence:

1. Connect a WhatsApp number
2. Check the database:
   ```sql
   SELECT agentId, isConnected, sessionData FROM whatsapp_connections;
   ```
3. You should see `sessionData` populated with auth credentials
4. Restart the server
5. Connection should restore automatically without QR scanning

### Deployment to Railway

No special configuration needed! The fix works out of the box on Railway since we're using the database which Railway already persists.

## Technical Details

### Auth State Storage Format

The `sessionData` JSON field stores:
```json
{
  "creds": {
    "noiseKey": {...},
    "signedIdentityKey": {...},
    "signedPreKey": {...},
    "registrationId": 12345,
    "advSecretKey": "...",
    "nextPreKeyId": 31,
    "firstUnuploadedPreKeyId": 31,
    "serverHasPreKeys": true,
    "account": {...},
    "me": {...},
    "signalIdentities": [...]
  },
  "keys": {
    "pre-key-1": {...},
    "session-12345": {...},
    "sender-key-12345": {...},
    "app-state-sync-key-12345": {...}
  }
}
```

### Functions Available

```typescript
// Use database auth state (replaces useMultiFileAuthState)
const { state, saveCreds } = await useDatabaseAuthState(agentId);

// Clear session from database (on logout/disconnect)
await clearDatabaseAuthState(agentId);
```

## Rollback (If Needed)

If you need to rollback to file-based storage:

1. Revert `lib/whatsapp-service-fixed.ts` to use `useMultiFileAuthState`
2. Revert `lib/database-auth-state.ts` (or delete it)
3. Restore the `authDir` property and file system operations

However, this is **not recommended** as it brings back the disconnection issue.

## FAQ

**Q: Do I need to run a database migration?**
A: No! The `sessionData` field already exists in the schema.

**Q: Will existing connections work?**
A: Existing file-based sessions will not be automatically migrated. Users will need to reconnect once, then they'll stay connected permanently.

**Q: What about the old `whatsapp_sessions/` directory?**
A: It's no longer used and can be safely deleted.

**Q: Will this work on Vercel/Netlify?**
A: Yes, as long as you have a persistent database connection.

**Q: Does this affect performance?**
A: No noticeable impact. Database reads are fast, and auth state is only loaded once during connection.

## Credits

This fix was implemented to solve the persistent issue of WhatsApp disconnections on Railway deployments. The solution leverages the existing `sessionData` field that was already in the schema but wasn't being utilized.

---

**Status**: ✅ Deployed
**Date**: 2025-11-26
**Impact**: All users will maintain WhatsApp connections across deployments
