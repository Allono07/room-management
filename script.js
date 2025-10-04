// Configuration - Replace with your actual Google Sheets details
const CONFIG = {
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Replace with your Google Sheets ID
    API_KEY: 'YOUR_API_KEY', // Replace with your Google API key
    RANGE: 'Sheet1!A:E', // Adjust range as needed
    ROOMMATES: ['ALLEN', 'DEBIN', 'GREEN', 'JITHU']
};

// Global state
let roommateData = {};
let waterTripData = [];
let currentUpdatingPerson = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    showLoading(true);
    
    try {
        await loadDataFromSheets();
        renderRoommateCards();
        renderWaterTrips();
        renderWaterRoommateCards();
        updateLatestIndicator();
        updateMostIndicator();
        updateWaterLatestIndicator();
        updateWaterMostIndicator();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load data. Please check your configuration and try again.');
    } finally {
        showLoading(false);
    }
}

// Google Sheets API functions
async function loadDataFromSheets() {
    try {
        // For demo purposes, we'll use mock data
        // In production, replace this with actual Google Sheets API calls
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

        // Mock water bottle trip data
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

        // Uncomment and replace the mock data above with this real API call:
        /*
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.RANGE}?key=${CONFIG.API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        processSheetData(data.values);
        */
        
    } catch (error) {
        console.error('Error loading data from sheets:', error);
        throw error;
    }
}

function processSheetData(values) {
    if (!values || values.length < 2) {
        throw new Error('No data found in the sheet');
    }

    const headers = values[0];
    const dataRows = values.slice(1);
    
    // Initialize roommate data
    CONFIG.ROOMMATES.forEach(roommate => {
        roommateData[roommate] = {
            name: roommate,
            dates: [],
            lastDate: null,
            count: 0
        };
    });

    // Process each data row
    dataRows.forEach(row => {
        if (row.length === 0 || !row[0]) return; // Skip empty rows
        
        CONFIG.ROOMMATES.forEach((roommate, index) => {
            const dateValue = row[index + 1]; // +1 because first column is row number/identifier
            if (dateValue && dateValue.trim()) {
                roommateData[roommate].dates.push(dateValue.trim());
                roommateData[roommate].count++;
                roommateData[roommate].lastDate = dateValue.trim();
            }
        });
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
                <span class="stat-number">${data.count}</span>
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
    
    window.onclick = function(event) {
        if (event.target === modal) {
            closeUpdateModal();
        }
        if (event.target === waterModal) {
            closeWaterModal();
        }
    };
    
    // Update buttons
    document.getElementById('updateBtn').addEventListener('click', handleUpdate);
    document.getElementById('waterUpdateBtn').addEventListener('click', handleWaterUpdate);
    
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
            updateLatestIndicator();
            updateMostIndicator();
            updateWaterLatestIndicator();
            updateWaterMostIndicator();
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
        
        // In production, update the Google Sheet here
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
    // For demo purposes, we'll just log the update
    // In production, implement Google Sheets API write functionality
    console.log(`Updating ${roommateName} with date: ${dateValue}`);
    
    // Uncomment and implement this for real Google Sheets integration:
    /*
    const values = [[dateValue]];
    const roomateIndex = CONFIG.ROOMMATES.indexOf(roommateName);
    const column = String.fromCharCode(65 + roomateIndex + 1); // A=65, B=66, etc.
    
    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/Sheet1!${column}1:${column}1000?valueInputOption=USER_ENTERED&key=${CONFIG.API_KEY}`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: [values]
            })
        }
    );
    
    if (!response.ok) {
        throw new Error(`Failed to update sheet: ${response.status}`);
    }
    */
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

// Make functions global for onclick handlers
window.openUpdateModal = openUpdateModal;
window.openWaterUpdateModal = openWaterUpdateModal;
