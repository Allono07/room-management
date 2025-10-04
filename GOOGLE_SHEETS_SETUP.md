# Google Sheets Integration Setup Guide

## Step 1: Create Google Sheets

Create a new Google Sheet with these exact tab names and structures:

### Tab 1: "Waste"
```
| A | B      | C      | D      | E      |
|---|--------|--------|--------|--------|
| 1 | ALLEN  | DEBIN  | GREEN  | JITHU  |
| 2 | 23/09/2025 | 23/09/2025 | 23/09/2025 | 23/09/2025 |
| 3 | 25/09/2025 |        |        |        |
```

### Tab 2: "Water"
```
| A      | B      | C      | D      |
|--------|--------|--------|--------|
| Date   | Time   | Person1| Person2|
| 22/09/2025 | 14:30 | ALLEN  | DEBIN  |
| 24/09/2025 | 16:45 | GREEN  | JITHU  |
| 26/09/2025 | 10:15 | ALLEN  | GREEN  |
```

### Tab 3: "Cleaning"
```
| A      | B      | C      | D       |
|--------|--------|--------|---------|
| Date   | Time   | Person | Location|
| 21/09/2025 | 09:30 | ALLEN  | kitchen |
| 23/09/2025 | 14:15 | DEBIN  | hall    |
| 25/09/2025 | 11:45 | GREEN  | kitchen |
```

## Step 2: Get Google Sheets ID

Copy the Google Sheets ID from the URL:
- URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
- ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

## Step 3: Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to "APIs & Services" → "Library"
4. Search for "Google Sheets API"
5. Click "Enable"

## Step 4: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Click "Restrict Key" and:
   - Application restrictions: HTTP referrers
   - Add: `localhost:8000/*`
   - API restrictions: Google Sheets API

## Step 5: Update Configuration

Open `script.js` and replace:

```javascript
const CONFIG = {
    SPREADSHEET_ID: 'YOUR_ACTUAL_SHEET_ID_HERE',
    API_KEY: 'YOUR_ACTUAL_API_KEY_HERE',
    // ... rest stays the same
};
```

## Step 6: Test the Integration

1. Save the file
2. Refresh your browser at `http://localhost:8000`
3. Check the browser console for any errors
4. Try adding new entries to see if they appear in Google Sheets

## Troubleshooting

### Common Issues:

1. **"Failed to load data"**
   - Check API key is correct
   - Ensure Google Sheets API is enabled
   - Verify spreadsheet ID is correct

2. **"Access denied"**
   - Check API key restrictions
   - Ensure HTTP referrer includes `localhost:8000/*`

3. **"Sheet not found"**
   - Verify tab names are exactly: "Waste", "Water", "Cleaning"
   - Check spreadsheet ID is correct

4. **Data not updating**
   - Check browser console for errors
   - Verify sheet structure matches expected format
   - Ensure all required fields are filled

### Testing Steps:

1. **Test Reading**: Refresh the page and check if data loads from sheets
2. **Test Writing**: Add a new entry and check if it appears in Google Sheets
3. **Test All Tabs**: Try adding entries to Waste, Water, and Cleaning tabs

## Security Notes

- Keep your API key secure
- Don't commit API keys to version control
- Consider using environment variables for production
- Restrict API key to your domain only

## Production Deployment

For production use:
1. Replace `localhost:8000/*` with your actual domain
2. Use HTTPS for your website
3. Consider implementing OAuth2 for better security
4. Set up proper CORS headers if needed

## Example Working Configuration

```javascript
const CONFIG = {
    SPREADSHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    API_KEY: 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    WASTE_SHEET: 'Waste!A:E',
    WATER_SHEET: 'Water!A:E', 
    CLEANING_SHEET: 'Cleaning!A:E',
    ROOMMATES: ['ALLEN', 'DEBIN', 'GREEN', 'JITHU']
};
```

Once configured, your app will automatically:
- Load data from Google Sheets on startup
- Save new entries to Google Sheets
- Update counters and indicators in real-time
- Show success/error messages for operations
