// Configuration - Replace with your actual Google Sheets details
const CONFIG = {
    SPREADSHEET_ID: '19w8SGE8dc4c_PxI4mBg-0nEerRvUsqOxPSE__BfK4gQ', // Replace with your Google Sheets ID
    API_KEY: 'AIzaSyCNTFlcVxF16w5jIGYdp5d9rBg2IHjAsCU', // Replace with your Google API key
    CLIENT_ID: '311551867349-ee4mroopunj16n40lt92qlfblftg2j9d.apps.googleusercontent.com', // OAuth2 Client ID
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    WASTE_SHEET: 'Waste!A:E',
    WATER_SHEET: 'Water!A:E', 
    CLEANING_SHEET: 'Cleaning!A:E',
    ROOMMATES: ['ALLEN', 'DEBIN', 'GREEN', 'JITHU']
};

// Global state
let roommateData = {};
let waterTripData = [];
let cleaningData = [];
let currentUpdatingPerson = null;
let isSignedIn = false;
let gapi = null;
let gapiLoaded = false;

// GIS state
let googleUser = null;
let googleToken = null;
let accessToken = null;
let tokenClient = null;

// Google API load callback
window.onGapiLoad = function() {
    console.log('Google API loaded successfully');
    gapiLoaded = true;
    gapi = window.gapi;
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    showLoading(true);
    
    try {
        // Initialize Google API
        await initializeGoogleAPI();
        
        // Load data from sheets
        await loadDataFromSheets();
        
        // Render all components
        renderRoommateCards();
        renderWaterTrips();
        renderWaterRoommateCards();
        renderCleaningHistory();
        renderCleaningRoommateCards();
        updateLatestIndicator();
        updateMostIndicator();
        updateWaterLatestIndicator();
        updateWaterMostIndicator();
        updateCleaningLatestIndicator();
        updateCleaningMostIndicator();
        setupEventListeners();
        
        // Update auth status
        updateAuthStatus();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load data. Please check your configuration and try again.');
    } finally {
        showLoading(false);
    }
}

async function checkAndDisplayAuthStatus() {
    const isAuthenticated = await checkAuthStatus();
    alert(isAuthenticated ? 
        'You are successfully authenticated with Google!' : 
        'You are not authenticated. Please check the console for more details.');
}

// OAuth2 Authentication Functions
async function initializeGoogleAPI() {
    return new Promise((resolve, reject) => {
        // Check if Google API is already loaded
        if (gapiLoaded && window.gapi) {
            console.log('Google API already loaded');
            initializeAuth2(resolve, reject);
            return;
        }

        // Check if Google API script is loaded
        if (typeof window.gapi === 'undefined') {
            console.log('Google API not loaded yet, waiting...');
            // Wait for Google API to load
            const checkGapi = setInterval(() => {
                if (gapiLoaded && window.gapi) {
                    clearInterval(checkGapi);
                    initializeAuth2(resolve, reject);
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkGapi);
                console.log('Google API failed to load, continuing without OAuth2');
                resolve(); // Continue without OAuth2
            }, 10000);
            return;
        }

        initializeAuth2(resolve, reject);
    });
}

async function initializeAuth2(resolve, reject) {
    try {
        await window.gapi.load('auth2', async () => {
            try {
                await window.gapi.auth2.init({
                    client_id: CONFIG.CLIENT_ID,
                    scope: CONFIG.SCOPES
                });
                
                gapi = window.gapi;
                console.log('Google API initialized successfully');
                resolve();
            } catch (error) {
                console.error('Error initializing Google API:', error);
                console.log('Continuing without OAuth2 authentication');
                resolve(); // Continue without OAuth2
            }
        });
    } catch (error) {
        console.error('Error loading Google API:', error);
        console.log('Continuing without OAuth2 authentication');
        resolve(); // Continue without OAuth2
    }
}

function initializeGIS() {
    window.onload = function() {
        google.accounts.id.initialize({
            client_id: CONFIG.CLIENT_ID,
            callback: handleCredentialResponse,
        });
        google.accounts.id.renderButton(
            document.getElementById('g_id_signin'),
            { theme: 'outline', size: 'large' }
        );
        // Initialize OAuth2 token client
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.CLIENT_ID,
            scope: CONFIG.SCOPES,
            callback: (tokenResponse) => {
                accessToken = tokenResponse.access_token;
                isSignedIn = true;
                updateAuthStatus();
                showSuccess('Access token received! You can now update sheets.');
                console.log('Access token:', accessToken);
            },
        });
    };
}

function handleCredentialResponse(response) {
    // Decode JWT to get user info
    googleToken = response.credential;
    const base64Url = googleToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    googleUser = JSON.parse(jsonPayload);
    // Request access token after sign-in
    tokenClient.requestAccessToken();
}

function signOut() {
    googleUser = null;
    googleToken = null;
    accessToken = null;
    isSignedIn = false;
    updateAuthStatus();
    showSuccess('Successfully signed out.');
    console.log('User signed out');
}

function checkAuthStatus() {
    if (googleUser && accessToken) {
        console.log('Auth Status:', {
            isSignedIn: true,
            userEmail: googleUser.email,
            accessToken: accessToken
        });
        return true;
    } else {
        console.log('Auth Status: Not signed in');
        return false;
    }
}

function updateAuthStatus() {
    const authButton = document.getElementById('authButton');
    if (authButton) {
        if (isSignedIn) {
            authButton.textContent = '🚪 Sign Out';
            authButton.onclick = signOut;
            authButton.classList.remove('btn-signin');
            authButton.classList.add('btn-signout');
        } else {
            authButton.textContent = '🔑 Sign In to Edit';
            authButton.onclick = function() {
                google.accounts.id.prompt();
            };
            authButton.classList.remove('btn-signout');
            authButton.classList.add('btn-signin');
        }
    }
}

function getAuthToken() {
    return accessToken;
}

// Call GIS initializer
initializeGIS();

// Google Sheets API functions
async function loadDataFromSheets() {
    try {
        // Check if API key and spreadsheet ID are configured
        if (CONFIG.API_KEY === 'YOUR_API_KEY' || CONFIG.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID') {
            console.log('Using mock data - configure Google Sheets API to use real data');
            loadMockData();
            return;
        }

        // Load data from all three sheets
        await Promise.all([
            loadWasteData(),
            loadWaterData(),
            loadCleaningData()
        ]);
        
    } catch (error) {
        console.error('Error loading data from sheets:', error);
        console.log('Falling back to mock data');
        loadMockData();
    }
}

async function loadWasteData() {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.WASTE_SHEET}?key=${CONFIG.API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        processWasteSheetData(data.values);
    } catch (error) {
        console.error('Error loading waste data:', error);
        throw error;
    }
}

async function loadWaterData() {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.WATER_SHEET}?key=${CONFIG.API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        processWaterSheetData(data.values);
    } catch (error) {
        console.error('Error loading water data:', error);
        throw error;
    }
}

async function loadCleaningData() {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.CLEANING_SHEET}?key=${CONFIG.API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        processCleaningSheetData(data.values);
    } catch (error) {
        console.error('Error loading cleaning data:', error);
        throw error;
    }
}

function loadMockData() {
    // Mock data for testing
    roommateData = {
        'ALLEN': {
            name: 'ALLEN',
            dates: ['23/09/2025', '25/09/2025'],
            lastDate: '25/09/2025',
            count: 2
        },
        'DEBIN': {
            name: 'DEBIN',
            dates: ['23/09/2025'],
            lastDate: '23/09/2025',
            count: 1
        },
        'GREEN': {
            name: 'GREEN',
            dates: ['23/09/2025'],
            lastDate: '23/09/2025',
            count: 1
        },
        'JITHU': {
            name: 'JITHU',
            dates: ['23/09/2025'],
            lastDate: '23/09/2025',
            count: 1
        }
    };

    waterTripData = [
        {
            date: '22/09/2025',
            time: '14:30',
            person1: 'ALLEN',
            person2: 'DEBIN',
            id: 1
        },
        {
            date: '24/09/2025',
            time: '16:45',
            person1: 'GREEN',
            person2: 'JITHU',
            id: 2
        },
        {
            date: '26/09/2025',
            time: '10:15',
            person1: 'ALLEN',
            person2: 'GREEN',
            id: 3
        }
    ];

    cleaningData = [
        {
            date: '21/09/2025',
            time: '09:30',
            person: 'ALLEN',
            location: 'kitchen',
            id: 1
        },
        {
            date: '23/09/2025',
            time: '14:15',
            person: 'DEBIN',
            location: 'hall',
            id: 2
        },
        {
            date: '25/09/2025',
            time: '11:45',
            person: 'GREEN',
            location: 'kitchen',
            id: 3
        },
        {
            date: '27/09/2025',
            time: '16:20',
            person: 'JITHU',
            location: 'hall',
            id: 4
        },
        {
            date: '28/09/2025',
            time: '10:10',
            person: 'ALLEN',
            location: 'hall',
            id: 5
        }
    ];
}

function processWasteSheetData(values) {
    // Initialize roommate data first
    CONFIG.ROOMMATES.forEach(roommate => {
        roommateData[roommate] = {
            name: roommate,
            dates: [],
            lastDate: null,
            count: 0
        };
    });

    if (!values || values.length < 2) {
        console.log('No waste data found in sheet, using empty data');
        return; // No data, keep empty
    }

    const headers = values[0];
    const dataRows = values.slice(1);
    
    console.log('Waste sheet headers:', headers);
    console.log('Waste sheet data rows:', dataRows);
    
    // Process each data row
    dataRows.forEach(row => {
        if (row.length === 0 || !row[0]) return; // Skip empty rows
        
        // The sheet structure is: [ALLEN, DEBIN, GREEN, JITHU] in the first row
        // Data rows should have dates in corresponding columns
        CONFIG.ROOMMATES.forEach((roommate, index) => {
            const dateValue = row[index]; // Direct column mapping
            if (dateValue && dateValue.trim()) {
                roommateData[roommate].dates.push(dateValue.trim());
                roommateData[roommate].count++;
                roommateData[roommate].lastDate = dateValue.trim();
            }
        });
    });
}

function processWaterSheetData(values) {
    waterTripData = [];
    
    if (!values || values.length < 2) {
        console.log('No water data found in sheet, using empty data');
        return; // No data, keep empty
    }

    const headers = values[0];
    const dataRows = values.slice(1);
    
    console.log('Water sheet headers:', headers);
    console.log('Water sheet data rows:', dataRows);
    
    dataRows.forEach((row, index) => {
        if (row.length >= 4 && row[0] && row[2] && row[3]) {
            waterTripData.push({
                date: row[0].trim(),
                time: row[1] ? row[1].trim() : '',
                person1: row[2].trim(),
                person2: row[3].trim(),
                id: index + 1
            });
        }
    });
}

function processCleaningSheetData(values) {
    cleaningData = [];
    
    if (!values || values.length < 2) {
        console.log('No cleaning data found in sheet, using empty data');
        return; // No data, keep empty
    }

    const headers = values[0];
    const dataRows = values.slice(1);
    
    console.log('Cleaning sheet headers:', headers);
    console.log('Cleaning sheet data rows:', dataRows);
    
    dataRows.forEach((row, index) => {
        if (row.length >= 4 && row[0] && row[2] && row[3]) {
            cleaningData.push({
                date: row[0].trim(),
                time: row[1] ? row[1].trim() : '',
                person: row[2].trim(),
                location: row[3].trim(),
                id: index + 1
            });
        }
    });
}

// UI Rendering functions
function renderRoommateCards() {
    const grid = document.getElementById('roommatesGrid');
    grid.innerHTML = '';

    CONFIG.ROOMMATES.forEach(roommate => {
        const data = roommateData[roommate];
        const card = createRoommateCard(data);
        grid.appendChild(card);
    });
}

function createRoommateCard(data) {
    // Safety check for undefined data
    if (!data || !data.name) {
        console.error('Invalid roommate data:', data);
        return document.createElement('div'); // Return empty div
    }

    const card = document.createElement('div');
    card.className = 'roommate-card';
    card.dataset.roommate = data.name;

    const isLatest = isLatestWasteKeeper(data.name);
    const isMost = isMostWasteKeeper(data.name);
    
    if (isLatest) {
        card.classList.add('latest');
    }
    if (isMost) {
        card.classList.add('most');
    }

    card.innerHTML = `
        <div class="roommate-name">${data.name}</div>
        <div class="roommate-stats">
            <div class="stat">
                <span class="stat-number">${data.count || 0}</span>
                <span class="stat-label">Times</span>
            </div>
            <div class="stat">
                <span class="stat-number">${data.lastDate ? formatDate(data.lastDate) : 'Never'}</span>
                <span class="stat-label">Last Date</span>
            </div>
        </div>
        <div class="last-date">
            <div class="last-date-label">Most Recent:</div>
            <div class="last-date-value">${data.lastDate || 'No records'}</div>
        </div>
        <button class="update-btn" onclick="openUpdateModal('${data.name}')">
            Update Waste Date
        </button>
    `;

    return card;
}

// Water Bottle Functions
function renderWaterTrips() {
    const grid = document.getElementById('waterTripsGrid');
    grid.innerHTML = '';

    // Sort trips by date (most recent first)
    const sortedTrips = [...waterTripData].sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateB - dateA;
    });

    sortedTrips.forEach((trip, index) => {
        const card = createWaterTripCard(trip, index === 0);
        grid.appendChild(card);
    });
}

function createWaterTripCard(trip, isLatest) {
    const card = document.createElement('div');
    card.className = 'water-trip-card';
    card.dataset.tripId = trip.id;

    if (isLatest) {
        card.classList.add('latest');
    }

    card.innerHTML = `
        <div class="water-trip-date">${trip.date}</div>
        <div class="water-trip-people">
            <div class="water-trip-person">
                <div class="water-trip-person-label">First Person</div>
                <div class="water-trip-person-name">${trip.person1}</div>
            </div>
            <div class="water-trip-person">
                <div class="water-trip-person-label">Second Person</div>
                <div class="water-trip-person-name">${trip.person2}</div>
            </div>
        </div>
        <div class="water-trip-time">${trip.time || 'Time not specified'}</div>
    `;

    return card;
}

// Water Bottle Roommate Cards
function renderWaterRoommateCards() {
    const grid = document.getElementById('waterRoommatesGrid');
    grid.innerHTML = '';

    CONFIG.ROOMMATES.forEach(roommate => {
        const data = calculateWaterRoommateData(roommate);
        const card = createWaterRoommateCard(data);
        grid.appendChild(card);
    });
}

function calculateWaterRoommateData(roommateName) {
    const trips = waterTripData.filter(trip => 
        trip.person1 === roommateName || trip.person2 === roommateName
    );
    
    let lastTrip = null;
    if (trips.length > 0) {
        lastTrip = trips.reduce((latest, trip) => {
            const tripDate = parseDate(trip.date);
            const latestDate = latest ? parseDate(latest.date) : null;
            
            if (!latestDate || tripDate > latestDate) {
                return trip;
            }
            return latest;
        }, null);
    }
    
    return {
        name: roommateName,
        count: trips.length,
        lastTrip: lastTrip,
        lastDate: lastTrip ? lastTrip.date : null
    };
}

function createWaterRoommateCard(data) {
    const card = document.createElement('div');
    card.className = 'water-roommate-card';
    card.dataset.roommate = data.name;

    const isLatest = isLatestWaterKeeper(data.name);
    const isMost = isMostWaterKeeper(data.name);
    
    if (isLatest) {
        card.classList.add('latest');
    }
    if (isMost) {
        card.classList.add('most');
    }

    card.innerHTML = `
        <div class="water-roommate-name">${data.name}</div>
        <div class="water-roommate-stats">
            <div class="water-stat">
                <span class="water-stat-number">${data.count}</span>
                <span class="water-stat-label">Trips</span>
            </div>
            <div class="water-stat">
                <span class="water-stat-number">${data.lastDate ? formatDate(data.lastDate) : 'Never'}</span>
                <span class="water-stat-label">Last Trip</span>
            </div>
        </div>
        <div class="water-last-trip">
            <div class="water-last-trip-label">Most Recent:</div>
            <div class="water-last-trip-value">${data.lastDate || 'No trips recorded'}</div>
        </div>
    `;

    return card;
}

function isLatestWaterKeeper(roommateName) {
    const latestTrip = getLatestWaterTrip();
    return latestTrip && (latestTrip.person1 === roommateName || latestTrip.person2 === roommateName);
}

function isMostWaterKeeper(roommateName) {
    return getMostWaterTripPerson() === roommateName;
}

// Cleaning Functions
function renderCleaningHistory() {
    const grid = document.getElementById('cleaningHistoryGrid');
    grid.innerHTML = '';

    // Sort cleaning sessions by date (most recent first)
    const sortedCleaning = [...cleaningData].sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateB - dateA;
    });

    sortedCleaning.forEach((session, index) => {
        const card = createCleaningHistoryCard(session, index === 0);
        grid.appendChild(card);
    });
}

function createCleaningHistoryCard(session, isLatest) {
    const card = document.createElement('div');
    card.className = 'cleaning-history-card';
    card.dataset.sessionId = session.id;

    if (isLatest) {
        card.classList.add('latest');
    }

    card.innerHTML = `
        <div class="cleaning-history-date">${session.date}</div>
        <div class="cleaning-history-info">
            <div class="cleaning-history-person">
                <div class="cleaning-history-person-label">Person</div>
                <div class="cleaning-history-person-name">${session.person}</div>
            </div>
            <div class="cleaning-history-location">
                <div class="cleaning-history-location-label">Location</div>
                <div class="cleaning-history-location-value">${session.location}</div>
            </div>
        </div>
        <div class="cleaning-history-time">${session.time || 'Time not specified'}</div>
    `;

    return card;
}

function renderCleaningRoommateCards() {
    const grid = document.getElementById('cleaningRoommatesGrid');
    grid.innerHTML = '';

    CONFIG.ROOMMATES.forEach(roommate => {
        const data = calculateCleaningRoommateData(roommate);
        const card = createCleaningRoommateCard(data);
        grid.appendChild(card);
    });
}

function calculateCleaningRoommateData(roommateName) {
    const sessions = cleaningData.filter(session => session.person === roommateName);
    
    let lastSession = null;
    if (sessions.length > 0) {
        lastSession = sessions.reduce((latest, session) => {
            const sessionDate = parseDate(session.date);
            const latestDate = latest ? parseDate(latest.date) : null;
            
            if (!latestDate || sessionDate > latestDate) {
                return session;
            }
            return latest;
        }, null);
    }
    
    return {
        name: roommateName,
        count: sessions.length,
        lastSession: lastSession,
        lastDate: lastSession ? lastSession.date : null
    };
}

function createCleaningRoommateCard(data) {
    const card = document.createElement('div');
    card.className = 'cleaning-roommate-card';
    card.dataset.roommate = data.name;

    const isLatest = isLatestCleaningKeeper(data.name);
    const isMost = isMostCleaningKeeper(data.name);
    
    if (isLatest) {
        card.classList.add('latest');
    }
    if (isMost) {
        card.classList.add('most');
    }

    card.innerHTML = `
        <div class="cleaning-roommate-name">${data.name}</div>
        <div class="cleaning-roommate-stats">
            <div class="cleaning-stat">
                <span class="cleaning-stat-number">${data.count}</span>
                <span class="cleaning-stat-label">Sessions</span>
            </div>
            <div class="cleaning-stat">
                <span class="cleaning-stat-number">${data.lastDate ? formatDate(data.lastDate) : 'Never'}</span>
                <span class="cleaning-stat-label">Last Session</span>
            </div>
        </div>
        <div class="cleaning-last-session">
            <div class="cleaning-last-session-label">Most Recent:</div>
            <div class="cleaning-last-session-value">${data.lastDate || 'No sessions recorded'}</div>
        </div>
    `;

    return card;
}

function isLatestCleaningKeeper(roommateName) {
    const latestSession = getLatestCleaningSession();
    return latestSession && latestSession.person === roommateName;
}

function isMostCleaningKeeper(roommateName) {
    return getMostCleaningPerson() === roommateName;
}

// Cleaning Indicator Functions
function updateCleaningLatestIndicator() {
    const latestSession = getLatestCleaningSession();
    const badge = document.getElementById('cleaningLatestBadge');
    const personSpan = document.getElementById('cleaningLatestPerson');
    
    if (latestSession) {
        personSpan.textContent = latestSession.person;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function updateCleaningMostIndicator() {
    const mostPerson = getMostCleaningPerson();
    const badge = document.getElementById('cleaningMostBadge');
    const personSpan = document.getElementById('cleaningMostPerson');
    
    if (mostPerson) {
        personSpan.textContent = mostPerson;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function getLatestCleaningSession() {
    if (cleaningData.length === 0) return null;
    
    return cleaningData.reduce((latest, session) => {
        const sessionDate = parseDate(session.date);
        const latestDate = latest ? parseDate(latest.date) : null;
        
        if (!latestDate || sessionDate > latestDate) {
            return session;
        }
        return latest;
    }, null);
}

function getMostCleaningPerson() {
    const sessionCounts = {};
    
    // Count sessions for each person
    cleaningData.forEach(session => {
        sessionCounts[session.person] = (sessionCounts[session.person] || 0) + 1;
    });
    
    // Find person with most sessions
    let mostPerson = null;
    let highestCount = 0;
    
    Object.entries(sessionCounts).forEach(([person, count]) => {
        if (count > highestCount) {
            highestCount = count;
            mostPerson = person;
        }
    });
    
    return mostPerson;
}

function updateLatestIndicator() {
    const latestPerson = getLatestWasteKeeper();
    const badge = document.getElementById('latestBadge');
    const personSpan = document.getElementById('latestPerson');
    
    if (latestPerson) {
        personSpan.textContent = latestPerson;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function updateMostIndicator() {
    const mostPerson = getMostWasteKeeper();
    const badge = document.getElementById('mostBadge');
    const personSpan = document.getElementById('mostPerson');
    
    if (mostPerson) {
        personSpan.textContent = mostPerson;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function isLatestWasteKeeper(roommateName) {
    return getLatestWasteKeeper() === roommateName;
}

function isMostWasteKeeper(roommateName) {
    return getMostWasteKeeper() === roommateName;
}

function getLatestWasteKeeper() {
    let latestPerson = null;
    let latestDate = null;

    CONFIG.ROOMMATES.forEach(roommate => {
        const data = roommateData[roommate];
        if (data.lastDate) {
            const dateObj = parseDate(data.lastDate);
            if (!latestDate || dateObj > latestDate) {
                latestDate = dateObj;
                latestPerson = roommate;
            }
        }
    });

    return latestPerson;
}

function getMostWasteKeeper() {
    let mostPerson = null;
    let highestCount = 0;

    CONFIG.ROOMMATES.forEach(roommate => {
        const data = roommateData[roommate];
        if (data.count > highestCount) {
            highestCount = data.count;
            mostPerson = roommate;
        }
    });

    // If there's a tie, return the first person alphabetically
    if (highestCount > 0) {
        const tiedPersons = CONFIG.ROOMMATES.filter(roommate => 
            roommateData[roommate].count === highestCount
        );
        return tiedPersons.sort()[0];
    }

    return null;
}

// Water Bottle Indicator Functions
function updateWaterLatestIndicator() {
    const latestTrip = getLatestWaterTrip();
    const badge = document.getElementById('waterLatestBadge');
    const personSpan = document.getElementById('waterLatestPerson');
    
    if (latestTrip) {
        personSpan.textContent = `${latestTrip.person1} & ${latestTrip.person2}`;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function updateWaterMostIndicator() {
    const mostPerson = getMostWaterTripPerson();
    const badge = document.getElementById('waterMostBadge');
    const personSpan = document.getElementById('waterMostPerson');
    
    if (mostPerson) {
        personSpan.textContent = mostPerson;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function getLatestWaterTrip() {
    if (waterTripData.length === 0) return null;
    
    return waterTripData.reduce((latest, trip) => {
        const tripDate = parseDate(trip.date);
        const latestDate = latest ? parseDate(latest.date) : null;
        
        if (!latestDate || tripDate > latestDate) {
            return trip;
        }
        return latest;
    }, null);
}

function getMostWaterTripPerson() {
    const tripCounts = {};
    
    // Count trips for each person
    waterTripData.forEach(trip => {
        tripCounts[trip.person1] = (tripCounts[trip.person1] || 0) + 1;
        tripCounts[trip.person2] = (tripCounts[trip.person2] || 0) + 1;
    });
    
    // Find person with most trips
    let mostPerson = null;
    let highestCount = 0;
    
    Object.entries(tripCounts).forEach(([person, count]) => {
        if (count > highestCount) {
            highestCount = count;
            mostPerson = person;
        }
    });
    
    return mostPerson;
}

// Date utility functions
function parseDate(dateString) {
    // Handle DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    return new Date(dateString);
}

function formatDate(dateString) {
    const date = parseDate(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateForSheet(dateInput, timeInput = '') {
    const date = new Date(dateInput);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    let formattedDate = `${day}/${month}/${year}`;
    
    if (timeInput) {
        formattedDate += ` ${timeInput}`;
    }
    
    return formattedDate;
}

// Modal functions
function openUpdateModal(roommateName) {
    currentUpdatingPerson = roommateName;
    const modal = document.getElementById('updateModal');
    const dateInput = document.getElementById('wasteDate');
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    modal.style.display = 'block';
    dateInput.focus();
}

function closeUpdateModal() {
    const modal = document.getElementById('updateModal');
    modal.style.display = 'none';
    currentUpdatingPerson = null;
    
    // Reset form
    document.getElementById('wasteDate').value = '';
    document.getElementById('wasteTime').value = '';
}

// Water Bottle Modal Functions
function openWaterUpdateModal() {
    const modal = document.getElementById('waterModal');
    const dateInput = document.getElementById('waterDate');
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    modal.style.display = 'block';
    dateInput.focus();
}

function closeWaterModal() {
    const modal = document.getElementById('waterModal');
    modal.style.display = 'none';
    
    // Reset form
    document.getElementById('waterDate').value = '';
    document.getElementById('waterTime').value = '';
    document.getElementById('person1').value = '';
    document.getElementById('person2').value = '';
}

// Cleaning Modal Functions
function openCleaningUpdateModal() {
    const modal = document.getElementById('cleaningModal');
    const dateInput = document.getElementById('cleaningDate');
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    modal.style.display = 'block';
    dateInput.focus();
}

function closeCleaningModal() {
    const modal = document.getElementById('cleaningModal');
    modal.style.display = 'none';
    
    // Reset form
    document.getElementById('cleaningDate').value = '';
    document.getElementById('cleaningTime').value = '';
    document.getElementById('cleaningPerson').value = '';
    document.getElementById('cleaningLocation').value = '';
}

// Event listeners
function setupEventListeners() {
    // Modal close events
    const modal = document.getElementById('updateModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = closeUpdateModal;
    
    // Water modal close events
    const waterModal = document.getElementById('waterModal');
    const waterCloseBtn = document.querySelector('.close-water');
    
    waterCloseBtn.onclick = closeWaterModal;
    
    // Cleaning modal close events
    const cleaningModal = document.getElementById('cleaningModal');
    const cleaningCloseBtn = document.querySelector('.close-cleaning');
    
    cleaningCloseBtn.onclick = closeCleaningModal;
    
    window.onclick = function(event) {
        if (event.target === modal) {
            closeUpdateModal();
        }
        if (event.target === waterModal) {
            closeWaterModal();
        }
        if (event.target === cleaningModal) {
            closeCleaningModal();
        }
    };
    
    // Update buttons
    document.getElementById('updateBtn').addEventListener('click', handleUpdate);
    document.getElementById('waterUpdateBtn').addEventListener('click', handleWaterUpdate);
    document.getElementById('cleaningUpdateBtn').addEventListener('click', handleCleaningUpdate);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        showLoading(true);
        try {
            await loadDataFromSheets();
            renderRoommateCards();
            renderWaterTrips();
            renderWaterRoommateCards();
            renderCleaningHistory();
            renderCleaningRoommateCards();
            updateLatestIndicator();
            updateMostIndicator();
            updateWaterLatestIndicator();
            updateWaterMostIndicator();
            updateCleaningLatestIndicator();
            updateCleaningMostIndicator();
            showSuccess('Data refreshed successfully!');
        } catch (error) {
            console.error('Error refreshing data:', error);
            showError('Failed to refresh data. Please try again.');
        } finally {
            showLoading(false);
        }
    });
}

async function handleUpdate() {
    const dateInput = document.getElementById('wasteDate');
    const timeInput = document.getElementById('wasteTime');
    
    if (!dateInput.value) {
        showError('Please select a date.');
        return;
    }
    
    if (!currentUpdatingPerson) {
        showError('No person selected for update.');
        return;
    }
    
    try {
        showLoading(true);
        
        const formattedDate = formatDateForSheet(dateInput.value, timeInput.value);
        
        // Update local data
        const personData = roommateData[currentUpdatingPerson];
        personData.dates.push(formattedDate);
        personData.count++;
        personData.lastDate = formattedDate;
        
        // Update the Google Sheet
        await updateGoogleSheet(currentUpdatingPerson, formattedDate);
        
        // Refresh UI
        renderRoommateCards();
        updateLatestIndicator();
        updateMostIndicator();
        
        closeUpdateModal();
        showSuccess(`${currentUpdatingPerson}'s waste disposal date updated successfully!`);
        
    } catch (error) {
        console.error('Error updating data:', error);
        showError('Failed to update data. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function updateGoogleSheet(roommateName, dateValue) {
    if (!isSignedIn) {
        throw new Error('Please sign in to add entries');
    }
    
    try {
        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('No authentication token available');
        }
        
        // Find the next empty row in the waste sheet
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.WASTE_SHEET}?access_token=${authToken}`
        );
        
        if (!response.ok) {
            throw new Error(`Failed to read sheet: ${response.status}`);
        }
        
        const data = await response.json();
        const nextRow = data.values ? data.values.length + 1 : 2;
        
        // Create the row data
        const roommateIndex = CONFIG.ROOMMATES.indexOf(roommateName);
        const rowData = new Array(CONFIG.ROOMMATES.length + 1).fill('');
        rowData[0] = nextRow - 1; // Row number
        rowData[roommateIndex + 1] = dateValue;
        
        // Append the row
        const appendResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.WASTE_SHEET}:append?valueInputOption=USER_ENTERED&access_token=${authToken}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [rowData]
                })
            }
        );
        
        if (!appendResponse.ok) {
            throw new Error(`Failed to update sheet: ${appendResponse.status}`);
        }
        
        console.log(`Successfully updated ${roommateName} in Google Sheets`);
    } catch (error) {
        console.error('Error updating Google Sheet:', error);
        throw error;
    }
}

async function updateWaterSheet(dateValue, timeValue, person1, person2) {
    if (!isSignedIn) {
        throw new Error('Please sign in to add entries');
    }
    
    try {
        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('No authentication token available');
        }
        
        const rowData = [dateValue, timeValue || '', person1, person2];
        
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.WATER_SHEET}:append?valueInputOption=USER_ENTERED&access_token=${authToken}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [rowData]
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Failed to update water sheet: ${response.status}`);
        }
        
        console.log(`Successfully added water trip to Google Sheets`);
    } catch (error) {
        console.error('Error updating water sheet:', error);
        throw error;
    }
}

async function updateCleaningSheet(dateValue, timeValue, person, location) {
    if (!isSignedIn) {
        throw new Error('Please sign in to add entries');
    }
    
    try {
        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('No authentication token available');
        }
        
        const rowData = [dateValue, timeValue || '', person, location];
        
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.CLEANING_SHEET}:append?valueInputOption=USER_ENTERED&access_token=${authToken}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [rowData]
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Failed to update cleaning sheet: ${response.status}`);
        }
        
        console.log(`Successfully added cleaning session to Google Sheets`);
    } catch (error) {
        console.error('Error updating cleaning sheet:', error);
        throw error;
    }
}

// UI utility functions
function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error');
    existingErrors.forEach(error => error.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    // Remove existing success messages
    const existingSuccess = document.querySelectorAll('.success');
    existingSuccess.forEach(success => success.remove());
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.firstChild);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Tab switching function
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Water bottle update handler
async function handleWaterUpdate() {
    const dateInput = document.getElementById('waterDate');
    const timeInput = document.getElementById('waterTime');
    const person1Select = document.getElementById('person1');
    const person2Select = document.getElementById('person2');
    
    if (!dateInput.value) {
        showError('Please select a date.');
        return;
    }
    
    if (!person1Select.value || !person2Select.value) {
        showError('Please select both people.');
        return;
    }
    
    if (person1Select.value === person2Select.value) {
        showError('Please select two different people.');
        return;
    }
    
    try {
        showLoading(true);
        
        const formattedDate = formatDateForSheet(dateInput.value, timeInput.value);
        const newTrip = {
            date: formattedDate.split(' ')[0], // Just the date part
            time: timeInput.value || '',
            person1: person1Select.value,
            person2: person2Select.value,
            id: Date.now() // Simple ID generation
        };
        
        // Add to water trip data
        waterTripData.push(newTrip);
        
        // Update the Google Sheet
        await updateWaterSheet(newTrip.date, newTrip.time, newTrip.person1, newTrip.person2);
        
        // Refresh UI
        renderWaterTrips();
        renderWaterRoommateCards();
        updateWaterLatestIndicator();
        updateWaterMostIndicator();
        
        closeWaterModal();
        showSuccess(`Water bottle trip added successfully! ${newTrip.person1} & ${newTrip.person2} on ${newTrip.date}`);
        
    } catch (error) {
        console.error('Error updating water trip:', error);
        showError('Failed to add water trip. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Cleaning update handler
async function handleCleaningUpdate() {
    const dateInput = document.getElementById('cleaningDate');
    const timeInput = document.getElementById('cleaningTime');
    const personSelect = document.getElementById('cleaningPerson');
    const locationSelect = document.getElementById('cleaningLocation');
    
    if (!dateInput.value) {
        showError('Please select a date.');
        return;
    }
    
    if (!personSelect.value) {
        showError('Please select a person.');
        return;
    }
    
    if (!locationSelect.value) {
        showError('Please select a location.');
        return;
    }
    
    try {
        showLoading(true);
        
        const formattedDate = formatDateForSheet(dateInput.value, timeInput.value);
        const newSession = {
            date: formattedDate.split(' ')[0], // Just the date part
            time: timeInput.value || '',
            person: personSelect.value,
            location: locationSelect.value,
            id: Date.now() // Simple ID generation
        };
        
        // Add to cleaning data
        cleaningData.push(newSession);
        
        // Update the Google Sheet
        await updateCleaningSheet(newSession.date, newSession.time, newSession.person, newSession.location);
        
        // Refresh UI
        renderCleaningHistory();
        renderCleaningRoommateCards();
        updateCleaningLatestIndicator();
        updateCleaningMostIndicator();
        
        closeCleaningModal();
        showSuccess(`Cleaning session added successfully! ${newSession.person} cleaned ${newSession.location} on ${newSession.date}`);
        
    } catch (error) {
        console.error('Error updating cleaning session:', error);
        showError('Failed to add cleaning session. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Make functions global for onclick handlers
window.openUpdateModal = openUpdateModal;
window.openWaterUpdateModal = openWaterUpdateModal;
window.openCleaningUpdateModal = openCleaningUpdateModal;
