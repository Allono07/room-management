# OAuth2 Setup Guide for Google Sheets

## Step 1: Create OAuth2 Credentials


311551867349-ee4mroopunj16n40lt92qlfblftg2j9d.apps.googleusercontent.com

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **"APIs & Services"** → **"Credentials"**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**

## Step 2: Configure OAuth Consent Screen

If prompted, configure the OAuth consent screen:
- **User Type**: External (for personal use)
- **App Name**: Roommate Tracker
- **User Support Email**: Your email
- **Developer Contact**: Your email
- **Scopes**: Add `../auth/spreadsheets`

## Step 3: Create OAuth2 Client ID

1. **Application Type**: Web application
2. **Name**: Roommate Tracker Web App
3. **Authorized JavaScript origins**:
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`
   - `http://127.0.0.1:5500` (if using VS Code Live Server)
   - `https://yourdomain.com` (for production)
4. **Authorized redirect URIs**:
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`
   - `http://127.0.0.1:5500` (if using VS Code Live Server)
   - `https://yourdomain.com` (for production)

## Step 4: Get Your Credentials

After creation, you'll get:
- **Client ID**: `123456789-abcdef.apps.googleusercontent.com`
- **Client Secret**: (not needed for frontend apps)

## Step 5: Update Your Code

Replace the placeholder in `script.js`:

```javascript
const CONFIG = {
    SPREADSHEET_ID: '19w8SGE8dc4c_PxI4mBg-0nEerRvUsqOxPSE__BfK4gQ',
    API_KEY: 'AIzaSyCNTFlcVxF16w5jIGYdp5d9rBg2IHjAsCU',
    CLIENT_ID: 'YOUR_OAUTH2_CLIENT_ID_HERE', // Replace this
    // ... rest stays the same
};
```

## Step 6: Test the Setup

1. **Refresh your browser** at `http://localhost:8000`
2. **Click "🔑 Sign In to Edit"** button
3. **Authorize the app** in the popup
4. **Try adding entries** to test write functionality

## How It Works

### Authentication Flow
1. User clicks "Sign In to Edit"
2. Google OAuth popup appears
3. User authorizes the app
4. App receives access token
5. App can now read/write Google Sheets

### Security Features
- **Access tokens** expire automatically
- **User consent** required for each sign-in
- **Scoped permissions** (only Google Sheets access)
- **HTTPS required** for production

## Troubleshooting

### Common Issues:

1. **"Cross-Origin-Opener-Policy policy would block the window.postMessage call"**
   - **Cause**: Browser security policy blocking popup windows
   - **Solution**: Use the "Alternative Sign In" button that appears after the error
   - **Alternative**: Add `http://localhost:8000` to authorized redirect URIs in Google Cloud Console

2. **"Invalid client ID"**
   - Check Client ID is correct
   - Ensure authorized origins include `http://localhost:8000`

3. **"Access blocked"**
   - Check OAuth consent screen is configured
   - Verify scopes include Google Sheets

4. **"Token expired"**
   - User needs to sign in again
   - Tokens refresh automatically

5. **"Permission denied"**
   - User needs to grant Google Sheets access
   - Check spreadsheet sharing permissions

### COOP (Cross-Origin-Opener-Policy) Issues

If you see popup blocking errors:

1. **Use Alternative Sign In**: Click the "Alternative Sign In" button that appears
2. **Add Redirect URI**: In Google Cloud Console, add `http://localhost:8000` to authorized redirect URIs
3. **Browser Settings**: Allow popups for localhost in your browser
4. **HTTPS**: Use HTTPS in production to avoid COOP issues

### Testing Steps:

1. **Test Authentication**: Sign in/out works
2. **Test Reading**: Data loads from Google Sheets
3. **Test Writing**: New entries appear in Google Sheets
4. **Test All Tabs**: Waste, Water, Cleaning all work

## Production Deployment

For production use:

1. **Update authorized origins**:
   - Remove `http://localhost:8000`
   - Add your production domain

2. **Use HTTPS**:
   - OAuth2 requires HTTPS in production
   - Update your server configuration

3. **Domain verification**:
   - Verify your domain in Google Search Console
   - Add verification meta tag

## Example Working Configuration

```javascript
const CONFIG = {
    SPREADSHEET_ID: '19w8SGE8dc4c_PxI4mBg-0nEerRvUsqOxPSE__BfK4gQ',
    API_KEY: 'AIzaSyCNTFlcVxF16w5jIGYdp5d9rBg2IHjAsCU',
    CLIENT_ID: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    WASTE_SHEET: 'Waste!A:E',
    WATER_SHEET: 'Water!A:E', 
    CLEANING_SHEET: 'Cleaning!A:E',
    ROOMMATES: ['ALLEN', 'DEBIN', 'GREEN', 'JITHU']
};
```

## Benefits of OAuth2

✅ **Read & Write Access**: Full Google Sheets functionality  
✅ **User Authentication**: Only authorized users can edit  
✅ **Secure**: Industry-standard authentication  
✅ **Scalable**: Works for multiple users  
✅ **Professional**: Production-ready solution  

## Next Steps

1. **Create OAuth2 credentials** in Google Cloud Console
2. **Update CLIENT_ID** in your code
3. **Test authentication** and write operations
4. **Deploy to production** when ready

Once configured, your app will have full Google Sheets integration with secure user authentication!
