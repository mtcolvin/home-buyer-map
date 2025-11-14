/**
 * Home Buyer Map - Enhanced Application with Heat Maps and Crime Data
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
    maps: {},
    heatmapData: [],
    neighborhoodData: []
};

// ===================================
// Crime Data Service (Simulated)
// ===================================

const CrimeDataService = {
    /**
     * Simulates crime data API call
     * In production, this would call actual crime APIs like:
     * - FBI Crime Data API
     * - Local police department APIs
     * - CrimeReports.com API
     */
    async getCrimeData(lat, lng, radius = 5) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Generate realistic mock crime data
        const baseRate = 20 + Math.random() * 30; // crimes per 1000 residents

        return {
            crimeRate: baseRate,
            violent: Math.floor(baseRate * 0.25),
            property: Math.floor(baseRate * 0.75),
            trend: Math.random() > 0.5 ? 'decreasing' : 'increasing',
            safetyScore: this.calculateSafetyScore(baseRate)
        };
    },

    calculateSafetyScore(crimeRate) {
        // Lower crime rate = higher safety score
        // Scale: 0-100, where 100 is safest
        const maxCrimeRate = 100;
        return Math.max(0, Math.min(100, Math.round((1 - (crimeRate / maxCrimeRate)) * 100)));
    },

    getCrimeLevel(safetyScore) {
        if (safetyScore >= 75) return { level: 'Low', class: 'crime-low' };
        if (safetyScore >= 50) return { level: 'Medium', class: 'crime-medium' };
        return { level: 'High', class: 'crime-high' };
    }
};

// ===================================
// Scoring Algorithm
// ===================================

const ScoringEngine = {
    /**
     * Calculate neighborhood match score based on multiple factors
     */
    async calculateScore(lat, lng, criteria, preferences) {
        const scores = {
            crime: 0,
            schools: 0,
            amenities: 0,
            commute: 0,
            price: 0,
            overall: 0
        };

        const reasons = [];

        // 1. Crime Score (30% weight)
        const crimeData = await CrimeDataService.getCrimeData(lat, lng);
        scores.crime = crimeData.safetyScore;

        if (crimeData.safetyScore >= 75) {
            reasons.push('Low crime rate in this area');
        } else if (crimeData.safetyScore < 50) {
            reasons.push('Higher crime rate - consider safety measures');
        }

        // 2. Schools Score (25% weight)
        // Simulated based on location variations
        const schoolVariation = Math.sin(lat * 100) * Math.cos(lng * 100);
        scores.schools = Math.max(0, Math.min(100, 50 + schoolVariation * 50));

        if (preferences.amenities.includes('schools')) {
            if (scores.schools >= 70) {
                reasons.push('Excellent school ratings in the area');
            } else if (scores.schools < 50) {
                reasons.push('School ratings below average');
            }
        }

        // 3. Amenities Score (20% weight)
        scores.amenities = this.calculateAmenitiesScore(lat, lng, preferences.amenities);

        if (scores.amenities >= 70 && preferences.amenities.length > 0) {
            reasons.push(`Good access to ${preferences.amenities.length} desired amenities`);
        }

        // 4. Commute Score (15% weight)
        if (preferences.commuteCoords && preferences.maxCommute > 0) {
            scores.commute = this.calculateCommuteScore(
                lat, lng,
                preferences.commuteCoords.lat,
                preferences.commuteCoords.lng,
                preferences.maxCommute
            );

            if (scores.commute >= 80) {
                reasons.push('Short commute to work location');
            } else if (scores.commute < 40) {
                reasons.push('Longer commute time expected');
            }
        } else {
            scores.commute = 75; // Neutral if no commute preference
        }

        // 5. Price Score (10% weight)
        // Simulated property price variation
        const priceVariation = Math.sin(lat * 50) * Math.cos(lng * 50);
        const avgPrice = 500000 + priceVariation * 300000;

        if (avgPrice >= criteria.priceMin && avgPrice <= criteria.priceMax) {
            scores.price = 90;
            reasons.push('Properties within your price range');
        } else if (avgPrice > criteria.priceMax) {
            scores.price = 40;
            reasons.push('Properties may exceed your budget');
        } else {
            scores.price = 60;
            reasons.push('Limited inventory in this price range');
        }

        // Calculate weighted overall score
        scores.overall = Math.round(
            scores.crime * 0.30 +
            scores.schools * 0.25 +
            scores.amenities * 0.20 +
            scores.commute * 0.15 +
            scores.price * 0.10
        );

        return { scores, reasons, crimeData, avgPrice: Math.round(avgPrice) };
    },

    calculateAmenitiesScore(lat, lng, desiredAmenities) {
        if (desiredAmenities.length === 0) return 75; // Neutral if no preferences

        // Simulate amenity availability based on location
        const urbanFactor = Math.abs(Math.sin(lat * 10) * Math.cos(lng * 10));
        const baseScore = 40 + urbanFactor * 40;

        // Boost score based on number of desired amenities
        const amenityBoost = Math.min(20, desiredAmenities.length * 3);

        return Math.min(100, Math.round(baseScore + amenityBoost));
    },

    calculateCommuteScore(homeLat, homeLng, workLat, workLng, maxCommute) {
        // Calculate straight-line distance (in practice, use routing API)
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRad(workLat - homeLat);
        const dLng = this.toRad(workLng - homeLng);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRad(homeLat)) * Math.cos(this.toRad(workLat)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        // Estimate commute time (assuming 30 mph average in city)
        const estimatedMinutes = (distance / 30) * 60;

        // Score based on how it compares to max commute
        if (estimatedMinutes <= maxCommute * 0.5) return 100;
        if (estimatedMinutes <= maxCommute) return 80;
        if (estimatedMinutes <= maxCommute * 1.5) return 50;
        return 20;
    },

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
};

// ===================================
// Map Management
// ===================================

const MapManager = {
    heatLayer: null,
    customTooltip: null,
    invisibleMarkerLayer: null,

    init() {
        this.initMainMap();
    },

    initMainMap() {
        const map = L.map('map').setView([AppState.searchData.location.lat, AppState.searchData.location.lng], 12);

        // Use dark-themed map tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO',
            maxZoom: 19
        }).addTo(map);

        map.on('click', (e) => {
            this.handleMapClick(e, map);
        });

        AppState.maps.main = map;
    },

    handleMapClick(e, map) {
        const { lat, lng } = e.latlng;

        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        const marker = L.marker([lat, lng]).addTo(map);

        AppState.searchData.location.lat = lat;
        AppState.searchData.location.lng = lng;

        this.reverseGeocode(lat, lng);
    },

    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await response.json();

            const name = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            AppState.searchData.location.name = name;

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

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO',
            maxZoom: 19
        }).addTo(map);

        map.on('click', (e) => {
            const { lat, lng } = e.latlng;

            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

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

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO',
            maxZoom: 19
        }).addTo(map);

        L.marker([AppState.searchData.location.lat, AppState.searchData.location.lng])
            .addTo(map)
            .bindPopup('Search Area Center');

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

    async initExplorerMap() {
        if (AppState.maps.explorer) {
            AppState.maps.explorer.remove();
        }

        const map = L.map('explorerMap').setView(
            [AppState.searchData.location.lat, AppState.searchData.location.lng],
            14
        );

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO',
            maxZoom: 19
        }).addTo(map);

        // Generate heat map data
        await this.generateHeatmapData();

        // Add heat map layer
        this.addHeatmapLayer(map);

        // Add invisible markers for hover tooltips
        this.addInteractiveMarkers(map);

        AppState.maps.explorer = map;

        this.setupMapControls(map);
    },

    async generateHeatmapData() {
        const centerLat = AppState.searchData.location.lat;
        const centerLng = AppState.searchData.location.lng;
        const criteria = AppState.searchData.criteria;
        const preferences = AppState.searchData.preferences;

        AppState.heatmapData = [];
        AppState.neighborhoodData = [];

        // Generate grid of points around the search area
        const gridSize = 20; // 20x20 grid
        const latRange = 0.08; // ~5 miles
        const lngRange = 0.08;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const lat = centerLat - latRange/2 + (latRange / gridSize) * i;
                const lng = centerLng - lngRange/2 + (lngRange / gridSize) * j;

                // Calculate score for this point
                const result = await ScoringEngine.calculateScore(lat, lng, criteria, preferences);

                // Normalize score for heat map (0-1 range, higher is better)
                const intensity = result.scores.overall / 100;

                // Add to heat map data [lat, lng, intensity]
                AppState.heatmapData.push([lat, lng, intensity]);

                // Store detailed data for tooltips
                AppState.neighborhoodData.push({
                    lat,
                    lng,
                    ...result
                });
            }
        }
    },

    addHeatmapLayer(map) {
        if (this.heatLayer) {
            map.removeLayer(this.heatLayer);
        }

        // Create heat map with custom gradient
        this.heatLayer = L.heatLayer(AppState.heatmapData, {
            radius: 35,
            blur: 25,
            maxZoom: 17,
            max: 1.0,
            gradient: {
                0.0: 'rgba(0, 0, 255, 0)',
                0.2: 'rgba(0, 128, 255, 0.4)',
                0.4: 'rgba(0, 255, 255, 0.5)',
                0.5: 'rgba(0, 255, 0, 0.6)',
                0.7: 'rgba(255, 255, 0, 0.7)',
                0.85: 'rgba(255, 128, 0, 0.8)',
                1.0: 'rgba(255, 0, 0, 0.9)'
            }
        }).addTo(map);
    },

    addInteractiveMarkers(map) {
        // Remove old marker layer
        if (this.invisibleMarkerLayer) {
            map.removeLayer(this.invisibleMarkerLayer);
        }

        // Create transparent circle markers at each data point for interactivity
        const markers = AppState.neighborhoodData.map(data => {
            const marker = L.circleMarker([data.lat, data.lng], {
                radius: 8,
                fillColor: 'transparent',
                color: 'transparent',
                weight: 0,
                fillOpacity: 0
            });

            // Add hover events
            marker.on('mouseover', (e) => {
                this.showCustomTooltip(e, data, map);
            });

            marker.on('mouseout', () => {
                this.hideCustomTooltip();
            });

            marker.on('click', () => {
                this.showDetailedNeighborhoodInfo(data);
            });

            return marker;
        });

        this.invisibleMarkerLayer = L.layerGroup(markers).addTo(map);
    },

    showCustomTooltip(e, data, map) {
        this.hideCustomTooltip();

        const crimeLevel = CrimeDataService.getCrimeLevel(data.scores.crime);

        const tooltipHTML = `
            <div class="neighborhood-tooltip">
                <div class="tooltip-header">
                    <div class="tooltip-title">Neighborhood Analysis</div>
                    <div class="tooltip-match-score">${data.scores.overall}%</div>
                </div>

                <div class="tooltip-section">
                    <div class="tooltip-section-title">Key Metrics</div>

                    <div class="tooltip-metric">
                        <span class="tooltip-metric-label">Safety Score</span>
                        <span class="tooltip-metric-value">
                            ${data.scores.crime}%
                            <span class="tooltip-crime-level ${crimeLevel.class}">${crimeLevel.level}</span>
                        </span>
                    </div>

                    <div class="tooltip-metric">
                        <span class="tooltip-metric-label">School Rating</span>
                        <span class="tooltip-metric-value">
                            ${data.scores.schools}%
                            <div class="metric-bar">
                                <div class="metric-bar-fill" style="width: ${data.scores.schools}%"></div>
                            </div>
                        </span>
                    </div>

                    <div class="tooltip-metric">
                        <span class="tooltip-metric-label">Amenities</span>
                        <span class="tooltip-metric-value">
                            ${data.scores.amenities}%
                            <div class="metric-bar">
                                <div class="metric-bar-fill" style="width: ${data.scores.amenities}%"></div>
                            </div>
                        </span>
                    </div>

                    ${data.scores.commute < 75 ? `
                    <div class="tooltip-metric">
                        <span class="tooltip-metric-label">Commute</span>
                        <span class="tooltip-metric-value">
                            ${data.scores.commute}%
                            <div class="metric-bar">
                                <div class="metric-bar-fill" style="width: ${data.scores.commute}%"></div>
                            </div>
                        </span>
                    </div>
                    ` : ''}

                    <div class="tooltip-metric">
                        <span class="tooltip-metric-label">Avg. Price</span>
                        <span class="tooltip-metric-value">$${data.avgPrice.toLocaleString()}</span>
                    </div>
                </div>

                ${data.reasons.length > 0 ? `
                <div class="tooltip-reasons">
                    <div class="tooltip-section-title">Why this score?</div>
                    ${data.reasons.map(reason => `
                        <div class="tooltip-reason">${reason}</div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;

        // Create tooltip element
        const tooltipElement = document.createElement('div');
        tooltipElement.innerHTML = tooltipHTML;
        tooltipElement.style.position = 'absolute';
        tooltipElement.style.zIndex = '10000';
        tooltipElement.style.pointerEvents = 'none';

        // Position tooltip
        const point = map.latLngToContainerPoint(e.latlng);
        tooltipElement.style.left = (point.x + 15) + 'px';
        tooltipElement.style.top = (point.y - 50) + 'px';

        map.getContainer().appendChild(tooltipElement);
        this.customTooltip = tooltipElement;
    },

    hideCustomTooltip() {
        if (this.customTooltip && this.customTooltip.parentNode) {
            this.customTooltip.parentNode.removeChild(this.customTooltip);
            this.customTooltip = null;
        }
    },

    showDetailedNeighborhoodInfo(data) {
        const infoDiv = document.getElementById('neighborhoodDetails');
        const crimeLevel = CrimeDataService.getCrimeLevel(data.scores.crime);

        infoDiv.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h4 style="margin-bottom: 0.75rem; font-size: 1.1rem;">Area Details</h4>
                <div style="background: var(--gradient-primary); color: white; padding: 0.75rem; border-radius: 8px; text-align: center; font-weight: 700; font-size: 1.2rem;">
                    ${data.scores.overall}% Match
                </div>
            </div>

            <div style="font-size: 0.9rem; margin-top: 1rem;">
                <div style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
                    <strong style="color: var(--primary-light);">Safety Score:</strong>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
                        <span>${data.scores.crime}%</span>
                        <span class="tooltip-crime-level ${crimeLevel.class}">${crimeLevel.level} Crime</span>
                    </div>
                </div>

                <div style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
                    <strong style="color: var(--primary-light);">School Rating:</strong>
                    <span style="float: right;">${data.scores.schools}/100</span>
                </div>

                <div style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
                    <strong style="color: var(--primary-light);">Amenities Score:</strong>
                    <span style="float: right;">${data.scores.amenities}/100</span>
                </div>

                <div style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
                    <strong style="color: var(--primary-light);">Avg. Price:</strong>
                    <span style="float: right;">$${data.avgPrice.toLocaleString()}</span>
                </div>

                <div style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
                    <strong style="color: var(--primary-light);">Crime Rate:</strong>
                    <span style="float: right;">${data.crimeData.crimeRate.toFixed(1)} per 1K</span>
                </div>

                <div style="margin-bottom: 0.75rem;">
                    <strong style="color: var(--primary-light);">Crime Trend:</strong>
                    <span style="float: right; color: ${data.crimeData.trend === 'decreasing' ? 'var(--success-color)' : 'var(--warning-color)'};">
                        ${data.crimeData.trend === 'decreasing' ? '↓' : '↑'} ${data.crimeData.trend}
                    </span>
                </div>
            </div>

            ${data.reasons.length > 0 ? `
            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid var(--border-color);">
                <strong style="color: var(--primary-light); display: block; margin-bottom: 0.75rem;">Analysis:</strong>
                ${data.reasons.map(reason => `
                    <div style="margin-bottom: 0.5rem; padding-left: 1rem; position: relative; font-size: 0.85rem; color: var(--text-secondary);">
                        <span style="position: absolute; left: 0; color: var(--primary-color);">•</span>
                        ${reason}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <button class="btn-secondary full-width" style="margin-top: 1.5rem;" onclick="alert('In a real application, this would show detailed property listings for this area')">
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
        if (!this.validateStep(AppState.currentStep)) {
            return;
        }

        this.collectStepData(AppState.currentStep);

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
                setTimeout(async () => {
                    // Show loading message
                    const infoDiv = document.getElementById('neighborhoodDetails');
                    infoDiv.innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">🔍</div>
                            <div style="color: var(--primary-color); font-weight: 600;">Analyzing neighborhoods...</div>
                            <div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.5rem;">
                                Calculating crime data, schools, amenities
                            </div>
                        </div>
                    `;

                    await MapManager.initExplorerMap();

                    infoDiv.innerHTML = `
                        <p style="color: var(--text-secondary); font-style: italic;">
                            Hover over the heat map to see detailed neighborhood information
                        </p>
                    `;
                }, 100);
                break;
        }
    },

    populateReviewStep() {
        document.getElementById('reviewArea').textContent = AppState.searchData.location.name;

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

        const { preferences } = AppState.searchData;
        document.getElementById('reviewCommute').textContent = preferences.commuteLocation || 'Not set';
        document.getElementById('reviewMaxCommute').textContent = preferences.maxCommute === 0 ? 'Any' : `${preferences.maxCommute} min`;
        document.getElementById('reviewAmenities').textContent = preferences.amenities.length > 0
            ? preferences.amenities.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
            : 'None selected';
        document.getElementById('reviewNeighborhood').textContent = preferences.neighborhoodType || 'No preference';
    },

    populateExplorerStep() {
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
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Search link copied to clipboard!');
            }).catch(() => {
                prompt('Copy this link to share:', shareUrl);
            });
        }
    },

    updateUI() {
        document.querySelectorAll('.wizard-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === AppState.currentStep);
        });

        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.toggle('active', stepNum === AppState.currentStep);
            step.classList.toggle('completed', stepNum < AppState.currentStep);
        });

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.style.display = AppState.currentStep > 1 ? 'inline-flex' : 'none';
        nextBtn.textContent = AppState.currentStep === AppState.totalSteps ? 'Finish' : 'Next';

        if (AppState.currentStep === AppState.totalSteps) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-flex';
        }

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

                AppState.maps.main.setView([lat, lng], 12);

                AppState.maps.main.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        AppState.maps.main.removeLayer(layer);
                    }
                });

                L.marker([lat, lng]).addTo(AppState.maps.main);

                AppState.searchData.location = {
                    lat,
                    lng,
                    name: place.display_name,
                    zoom: 12
                };

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
    console.log('Home Buyer Map - Enhanced Application Starting...');

    MapManager.init();
    StepManager.init();
    SearchManager.init();
    URLManager.init();

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
