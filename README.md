# Roommate Waste Tracker

A web application to track which roommate took out the waste and when, with data stored in Google Sheets.

## Features

- 📊 **Real-time tracking** of waste disposal dates for each roommate
- 🔥 **Latest indicator** showing who took out waste most recently
- 📈 **Counter display** showing how many times each person has taken out waste
- 📱 **Responsive design** that works on desktop and mobile
- ✏️ **Easy updates** with date/time input for new waste disposal entries
- 🔄 **Auto-refresh** functionality to sync with Google Sheets data

## Roommates

- ALLEN
- DEBIN  
- GREEN
- JITHU

## Setup Instructions

### 1. Google Sheets Setup

1. Create a new Google Sheet with the following structure:
   ```
   NAME    ALLEN       DEBIN       GREEN       JITHU
          23/09/2025  23/09/2025  23/09/2025  23/09/2025
                   25/09/2025
   ```

2. Note your Google Sheets ID from the URL (the long string between `/d/` and `/edit`)

### 2. Google API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create credentials (API Key)
5. Restrict the API key to Google Sheets API for security

### 3. Configuration

1. Open `script.js`
2. Replace the following values in the `CONFIG` object:
   ```javascript
   const CONFIG = {
       SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Your Google Sheets ID
       API_KEY: 'YOUR_API_KEY', // Your Google API key
       RANGE: 'Sheet1!A:E', // Adjust range as needed
       ROOMMATES: ['ALLEN', 'DEBIN', 'GREEN', 'JITHU']
   };
   ```

### 4. Running the Application

1. Open `index.html` in a web browser
2. The application will load with mock data initially
3. To use real Google Sheets data, uncomment the API calls in `script.js`

## Usage

- **View Data**: The main page shows all roommates with their waste disposal counts and latest dates
- **Update Dates**: Click "Update Waste Date" on any roommate's card to add a new entry
- **Latest Indicator**: The person who took out waste most recently is highlighted with a special badge
- **Refresh**: Use the refresh button to reload data from Google Sheets

## File Structure

```
room/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## Security Notes

- The current implementation uses API keys for Google Sheets access
- For production use, consider implementing OAuth2 authentication
- Keep your API keys secure and never commit them to version control

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Common Issues

1. **"Failed to load data" error**:
   - Check your Google Sheets ID and API key
   - Ensure Google Sheets API is enabled
   - Verify the sheet has the correct structure

2. **"Failed to update data" error**:
   - Check API key permissions
   - Ensure the sheet is not protected/read-only
   - Verify the date format is correct

3. **Styling issues**:
   - Clear browser cache
   - Check browser console for CSS errors

## Future Enhancements

- [ ] OAuth2 authentication for better security
- [ ] Email notifications for overdue waste disposal
- [ ] Statistics and charts
- [ ] Mobile app version
- [ ] Multiple waste types (recycling, compost, etc.)
- [ ] Photo uploads for proof of disposal

## Contributing

Feel free to submit issues and enhancement requests!
