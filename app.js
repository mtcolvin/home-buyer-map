/**
 * Home Buyer Map - Main Application Logic
 */

// ===================================
// Application State
// ===================================

const AppState = {
    currentStep: 1,
    totalSteps: 5,
    searchData: {
        location: {
            lat: 37.7749,
            lng: -122.4194,
            name: 'San Francisco, CA',
            zoom: 12
        },
        criteria: {
            priceMin: 0,
            priceMax: 9999999,
            propertyTypes: ['house'],
            bedrooms: 0,
            bathrooms: 0,
            sqftMin: null,
            sqftMax: null
        },
        preferences: {
            commuteLocation: null,
            commuteCoords: null,
            maxCommute: 0,
            amenities: [],
            neighborhoodType: ''
        }
    },
    maps: {}
};

// ===================================
// Map Management
// ===================================

const MapManager = {
    init() {
        // Initialize main map (Step 1)
        this.initMainMap();
    },

    initMainMap() {
        const map = L.map('map').setView([AppState.searchData.location.lat, AppState.searchData.location.lng], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add click handler
        map.on('click', (e) => {
            this.handleMapClick(e, map);
        });

        AppState.maps.main = map;
    },

    handleMapClick(e, map) {
        const { lat, lng } = e.latlng;

        // Remove existing markers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add new marker
        const marker = L.marker([lat, lng]).addTo(map);

        // Update state
        AppState.searchData.location.lat = lat;
        AppState.searchData.location.lng = lng;

        // Geocode to get place name (simplified version)
        this.reverseGeocode(lat, lng);
    },

    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await response.json();

            const name = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            AppState.searchData.location.name = name;

            // Update UI
            document.getElementById('selectedArea').style.display = 'block';
            document.getElementById('areaName').textContent = name;
        } catch (error) {
            console.error('Geocoding error:', error);
            AppState.searchData.location.name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    },

    initCommuteMap() {
        if (AppState.maps.commute) {
            AppState.maps.commute.remove();
        }

        const map = L.map('commuteMap').setView([AppState.searchData.location.lat, AppState.searchData.location.lng], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        map.on('click', (e) => {
            const { lat, lng } = e.latlng;

            // Remove existing markers
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            // Add marker
            L.marker([lat, lng]).addTo(map)
                .bindPopup('Work Location')
                .openPopup();

            AppState.searchData.preferences.commuteCoords = { lat, lng };
            document.getElementById('commuteLocation').value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        });

        AppState.maps.commute = map;
    },

    initReviewMap() {
        if (AppState.maps.review) {
            AppState.maps.review.remove();
        }

        const map = L.map('reviewMap').setView(
            [AppState.searchData.location.lat, AppState.searchData.location.lng],
            AppState.searchData.location.zoom
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add search area marker
        L.marker([AppState.searchData.location.lat, AppState.searchData.location.lng])
            .addTo(map)
            .bindPopup('Search Area Center');

        // Add commute marker if set
        if (AppState.searchData.preferences.commuteCoords) {
            const { lat, lng } = AppState.searchData.preferences.commuteCoords;
            L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup('Commute Location');
        }

        AppState.maps.review = map;
    },

    initExplorerMap() {
        if (AppState.maps.explorer) {
            AppState.maps.explorer.remove();
        }

        const map = L.map('explorerMap').setView(
            [AppState.searchData.location.lat, AppState.searchData.location.lng],
            14 // Zoom in closer for neighborhood view
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add demo neighborhood overlays
        this.addNeighborhoodOverlays(map);

        // Handle clicks for neighborhood info
        map.on('click', (e) => {
            this.showNeighborhoodInfo(e.latlng);
        });

        AppState.maps.explorer = map;

        // Setup map controls
        this.setupMapControls(map);
    },

    addNeighborhoodOverlays(map) {
        // Create sample neighborhood boundaries
        const centerLat = AppState.searchData.location.lat;
        const centerLng = AppState.searchData.location.lng;

        // Generate demo neighborhoods with different match levels
        const neighborhoods = [
            { name: 'Green Valley', match: 'high', offset: [0.01, 0.01], color: '#4CAF50' },
            { name: 'Sunset District', match: 'medium', offset: [-0.01, 0.01], color: '#FFC107' },
            { name: 'Oak Hills', match: 'high', offset: [0.01, -0.01], color: '#4CAF50' },
            { name: 'River Park', match: 'low', offset: [-0.01, -0.01], color: '#F44336' },
            { name: 'Downtown', match: 'medium', offset: [0.005, -0.005], color: '#FFC107' }
        ];

        neighborhoods.forEach(neighborhood => {
            const bounds = [
                [centerLat + neighborhood.offset[0], centerLng + neighborhood.offset[1]],
                [centerLat + neighborhood.offset[0] + 0.008, centerLng + neighborhood.offset[1] + 0.008]
            ];

            const rectangle = L.rectangle(bounds, {
                color: neighborhood.color,
                fillColor: neighborhood.color,
                fillOpacity: 0.3,
                weight: 2
            }).addTo(map);

            rectangle.bindPopup(`
                <strong>${neighborhood.name}</strong><br>
                Match: ${neighborhood.match}<br>
                <em>Click for details</em>
            `);

            rectangle.on('click', () => {
                this.showDetailedNeighborhoodInfo(neighborhood);
            });
        });
    },

    showNeighborhoodInfo(latlng) {
        const infoDiv = document.getElementById('neighborhoodDetails');
        infoDiv.innerHTML = `
            <p><strong>Location:</strong> ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}</p>
            <p><em>Click on a colored neighborhood area for detailed information</em></p>
        `;
    },

    showDetailedNeighborhoodInfo(neighborhood) {
        const infoDiv = document.getElementById('neighborhoodDetails');

        // Generate mock data based on criteria
        const matchPercentage = neighborhood.match === 'high' ? 85 : neighborhood.match === 'medium' ? 65 : 45;
        const avgPrice = Math.floor(Math.random() * 500000) + 300000;
        const schools = Math.floor(Math.random() * 5) + 5;

        infoDiv.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h4 style="margin-bottom: 0.5rem;">${neighborhood.name}</h4>
                <div style="background: ${neighborhood.color}; color: white; padding: 0.5rem; border-radius: 4px; text-align: center; font-weight: 600;">
                    ${matchPercentage}% Match
                </div>
            </div>

            <div style="font-size: 0.9rem;">
                <p style="margin: 0.5rem 0;"><strong>Avg. Price:</strong> $${avgPrice.toLocaleString()}</p>
                <p style="margin: 0.5rem 0;"><strong>School Rating:</strong> ${schools}/10</p>
                <p style="margin: 0.5rem 0;"><strong>Crime Rate:</strong> ${neighborhood.match === 'high' ? 'Low' : neighborhood.match === 'medium' ? 'Medium' : 'Higher'}</p>
                <p style="margin: 0.5rem 0;"><strong>Walk Score:</strong> ${Math.floor(Math.random() * 30) + 70}</p>
                <p style="margin: 0.5rem 0;"><strong>Transit Score:</strong> ${Math.floor(Math.random() * 40) + 50}</p>
            </div>

            <button class="btn-secondary full-width" style="margin-top: 1rem;" onclick="alert('In a real application, this would show detailed property listings for ${neighborhood.name}')">
                View Listings
            </button>
        `;
    },

    setupMapControls(map) {
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            map.zoomIn();
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            map.zoomOut();
        });

        document.getElementById('recenterBtn').addEventListener('click', () => {
            map.setView([AppState.searchData.location.lat, AppState.searchData.location.lng], 14);
        });
    }
};

// ===================================
// Step Navigation
// ===================================

const StepManager = {
    init() {
        this.updateUI();
        this.attachEventListeners();
    },

    attachEventListeners() {
        document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevStep());
    },

    nextStep() {
        // Validate current step
        if (!this.validateStep(AppState.currentStep)) {
            return;
        }

        // Collect data from current step
        this.collectStepData(AppState.currentStep);

        // Move to next step
        if (AppState.currentStep < AppState.totalSteps) {
            AppState.currentStep++;
            this.updateUI();
            this.onStepEnter(AppState.currentStep);
        }
    },

    prevStep() {
        if (AppState.currentStep > 1) {
            AppState.currentStep--;
            this.updateUI();
            this.onStepEnter(AppState.currentStep);
        }
    },

    validateStep(step) {
        switch(step) {
            case 1:
                if (!AppState.searchData.location.name) {
                    alert('Please select a location on the map or search for a city.');
                    return false;
                }
                return true;
            case 2:
                // Check at least one property type is selected
                const propertyTypes = document.querySelectorAll('input[name="propertyType"]:checked');
                if (propertyTypes.length === 0) {
                    alert('Please select at least one property type.');
                    return false;
                }
                return true;
            default:
                return true;
        }
    },

    collectStepData(step) {
        switch(step) {
            case 2:
                AppState.searchData.criteria = {
                    priceMin: parseInt(document.getElementById('priceMin').value),
                    priceMax: parseInt(document.getElementById('priceMax').value),
                    propertyTypes: Array.from(document.querySelectorAll('input[name="propertyType"]:checked'))
                        .map(cb => cb.value),
                    bedrooms: parseInt(document.getElementById('bedrooms').value),
                    bathrooms: parseFloat(document.getElementById('bathrooms').value),
                    sqftMin: parseInt(document.getElementById('sqftMin').value) || null,
                    sqftMax: parseInt(document.getElementById('sqftMax').value) || null
                };
                break;
            case 3:
                AppState.searchData.preferences = {
                    commuteLocation: document.getElementById('commuteLocation').value,
                    commuteCoords: AppState.searchData.preferences.commuteCoords,
                    maxCommute: parseInt(document.getElementById('maxCommute').value),
                    amenities: Array.from(document.querySelectorAll('input[name="amenity"]:checked'))
                        .map(cb => cb.value),
                    neighborhoodType: document.getElementById('neighborhoodType').value
                };
                break;
        }
    },

    onStepEnter(step) {
        switch(step) {
            case 3:
                // Show commute map if button is clicked
                document.getElementById('setCommuteBtn').addEventListener('click', function() {
                    const container = document.getElementById('commuteMapContainer');
                    container.style.display = 'block';
                    setTimeout(() => {
                        MapManager.initCommuteMap();
                    }, 100);
                });
                break;
            case 4:
                this.populateReviewStep();
                setTimeout(() => {
                    MapManager.initReviewMap();
                }, 100);
                break;
            case 5:
                this.populateExplorerStep();
                setTimeout(() => {
                    MapManager.initExplorerMap();
                }, 100);
                break;
        }
    },

    populateReviewStep() {
        // Location
        document.getElementById('reviewArea').textContent = AppState.searchData.location.name;

        // Criteria
        const { criteria } = AppState.searchData;
        const priceMin = criteria.priceMin === 0 ? 'No min' : `$${criteria.priceMin.toLocaleString()}`;
        const priceMax = criteria.priceMax === 9999999 ? 'No max' : `$${criteria.priceMax.toLocaleString()}`;
        document.getElementById('reviewPrice').textContent = `${priceMin} - ${priceMax}`;

        document.getElementById('reviewPropertyType').textContent = criteria.propertyTypes
            .map(t => t.charAt(0).toUpperCase() + t.slice(1))
            .join(', ');

        document.getElementById('reviewBedrooms').textContent = criteria.bedrooms === 0 ? 'Any' : `${criteria.bedrooms}+`;
        document.getElementById('reviewBathrooms').textContent = criteria.bathrooms === 0 ? 'Any' : `${criteria.bathrooms}+`;

        const sqftMin = criteria.sqftMin ? criteria.sqftMin.toLocaleString() : 'No min';
        const sqftMax = criteria.sqftMax ? criteria.sqftMax.toLocaleString() : 'No max';
        document.getElementById('reviewSqft').textContent = `${sqftMin} - ${sqftMax} sq ft`;

        // Preferences
        const { preferences } = AppState.searchData;
        document.getElementById('reviewCommute').textContent = preferences.commuteLocation || 'Not set';
        document.getElementById('reviewMaxCommute').textContent = preferences.maxCommute === 0 ? 'Any' : `${preferences.maxCommute} min`;
        document.getElementById('reviewAmenities').textContent = preferences.amenities.length > 0
            ? preferences.amenities.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
            : 'None selected';
        document.getElementById('reviewNeighborhood').textContent = preferences.neighborhoodType || 'No preference';
    },

    populateExplorerStep() {
        // Populate criteria summary
        const criteriaDiv = document.getElementById('criteriaList');
        const { criteria, preferences } = AppState.searchData;

        const priceMin = criteria.priceMin === 0 ? 'Any' : `$${criteria.priceMin.toLocaleString()}`;
        const priceMax = criteria.priceMax === 9999999 ? 'Any' : `$${criteria.priceMax.toLocaleString()}`;

        criteriaDiv.innerHTML = `
            <div><strong>Price:</strong> ${priceMin} - ${priceMax}</div>
            <div><strong>Beds:</strong> ${criteria.bedrooms === 0 ? 'Any' : criteria.bedrooms + '+'}</div>
            <div><strong>Baths:</strong> ${criteria.bathrooms === 0 ? 'Any' : criteria.bathrooms + '+'}</div>
            <div><strong>Property:</strong> ${criteria.propertyTypes.join(', ')}</div>
            ${preferences.maxCommute > 0 ? `<div><strong>Max Commute:</strong> ${preferences.maxCommute} min</div>` : ''}
        `;

        // Setup action buttons
        document.getElementById('editCriteriaBtn').addEventListener('click', () => {
            AppState.currentStep = 2;
            this.updateUI();
        });

        document.getElementById('saveSearchBtn').addEventListener('click', () => {
            this.saveSearch();
        });

        document.getElementById('shareSearchBtn').addEventListener('click', () => {
            this.shareSearch();
        });

        document.getElementById('startOverBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to start over? This will reset all your criteria.')) {
                location.reload();
            }
        });
    },

    saveSearch() {
        try {
            localStorage.setItem('homeBuyerSearch', JSON.stringify(AppState.searchData));
            alert('Search saved successfully! You can return to this search anytime.');
        } catch (error) {
            alert('Unable to save search. Please check your browser settings.');
        }
    },

    shareSearch() {
        const searchParams = new URLSearchParams({
            lat: AppState.searchData.location.lat,
            lng: AppState.searchData.location.lng,
            priceMin: AppState.searchData.criteria.priceMin,
            priceMax: AppState.searchData.criteria.priceMax
        });

        const shareUrl = `${window.location.origin}${window.location.pathname}?${searchParams.toString()}`;

        if (navigator.share) {
            navigator.share({
                title: 'Home Buyer Search',
                text: 'Check out my home search criteria',
                url: shareUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Search link copied to clipboard!');
            }).catch(() => {
                prompt('Copy this link to share:', shareUrl);
            });
        }
    },

    updateUI() {
        // Update step visibility
        document.querySelectorAll('.wizard-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === AppState.currentStep);
        });

        // Update progress bar
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.toggle('active', stepNum === AppState.currentStep);
            step.classList.toggle('completed', stepNum < AppState.currentStep);
        });

        // Update navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.style.display = AppState.currentStep > 1 ? 'inline-flex' : 'none';
        nextBtn.textContent = AppState.currentStep === AppState.totalSteps ? 'Finish' : 'Next';

        if (AppState.currentStep === AppState.totalSteps) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-flex';
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// ===================================
// Search Functionality
// ===================================

const SearchManager = {
    init() {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('citySearch');

        searchBtn.addEventListener('click', () => this.performSearch());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
    },

    async performSearch() {
        const query = document.getElementById('citySearch').value.trim();

        if (!query) {
            alert('Please enter a city or zip code');
            return;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
            const data = await response.json();

            if (data.length > 0) {
                const place = data[0];
                const lat = parseFloat(place.lat);
                const lng = parseFloat(place.lon);

                // Update map
                AppState.maps.main.setView([lat, lng], 12);

                // Remove existing markers
                AppState.maps.main.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        AppState.maps.main.removeLayer(layer);
                    }
                });

                // Add marker
                L.marker([lat, lng]).addTo(AppState.maps.main);

                // Update state
                AppState.searchData.location = {
                    lat,
                    lng,
                    name: place.display_name,
                    zoom: 12
                };

                // Update UI
                document.getElementById('selectedArea').style.display = 'block';
                document.getElementById('areaName').textContent = place.display_name;
            } else {
                alert('Location not found. Please try a different search term.');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Search failed. Please try again.');
        }
    }
};

// ===================================
// URL Parameter Handling
// ===================================

const URLManager = {
    init() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('lat') && params.has('lng')) {
            AppState.searchData.location.lat = parseFloat(params.get('lat'));
            AppState.searchData.location.lng = parseFloat(params.get('lng'));

            if (params.has('priceMin')) {
                AppState.searchData.criteria.priceMin = parseInt(params.get('priceMin'));
            }
            if (params.has('priceMax')) {
                AppState.searchData.criteria.priceMax = parseInt(params.get('priceMax'));
            }

            // Update map view
            if (AppState.maps.main) {
                AppState.maps.main.setView(
                    [AppState.searchData.location.lat, AppState.searchData.location.lng],
                    12
                );
            }
        }
    }
};

// ===================================
// Initialize Application
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Home Buyer Map - Application Starting...');

    // Initialize all managers
    MapManager.init();
    StepManager.init();
    SearchManager.init();
    URLManager.init();

    // Try to load saved search
    try {
        const savedSearch = localStorage.getItem('homeBuyerSearch');
        if (savedSearch) {
            const shouldLoad = confirm('Would you like to load your saved search?');
            if (shouldLoad) {
                AppState.searchData = JSON.parse(savedSearch);
                console.log('Loaded saved search');
            }
        }
    } catch (error) {
        console.log('No saved search available');
    }

    console.log('Application initialized successfully');
});
