# Quick Fix for OAuth2 Issues

## The Problem
You're getting these errors because:
1. **Origin mismatch**: You're accessing via `127.0.0.1:5500` but OAuth2 is configured for `localhost:8000`
2. **Missing origins**: Your OAuth2 client doesn't include all the origins you're using

## Solution

### Option 1: Use the Correct URL (Recommended)
1. **Stop any VS Code Live Server** (if running)
2. **Access the app via**: `http://localhost:8000` (not 127.0.0.1:5500)
3. The Python server is already running on port 8000

### Option 2: Update OAuth2 Client (If you prefer 127.0.0.1:5500)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth2 client ID: `311551867349-ee4mroopunj16n40lt92qlfblftg2j9d.apps.googleusercontent.com`
4. Add these to **Authorized JavaScript origins**:
   - `http://127.0.0.1:5500`
   - `http://127.0.0.1:8000`
5. Add these to **Authorized redirect URIs**:
   - `http://127.0.0.1:5500`
   - `http://127.0.0.1:8000`
6. **Save** the changes
7. Wait 5-10 minutes for changes to propagate

## Test Steps
1. **Access**: `http://localhost:8000` (recommended) or `http://127.0.0.1:5500`
2. **Click**: "🔑 Sign In to Edit"
3. **If popup fails**: Click "Alternative Sign In" button
4. **Complete**: Google authentication
5. **Test**: Try adding a waste disposal entry

## Current Status
- ✅ Python server running on port 8000
- ✅ OAuth2 client configured for localhost:8000
- ✅ Alternative authentication method available
- ⚠️ Need to use correct URL or update OAuth2 origins

## Next Steps
1. Try `http://localhost:8000` first (easiest)
2. If that doesn't work, update OAuth2 client origins
3. Test authentication and data entry
