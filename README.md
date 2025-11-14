# Home Buyer Map

A polished, multi-step web application that helps home buyers narrow down their ideal neighborhood through an intuitive, interactive process.

## Features

- **Multi-Step Wizard**: Progressive interface that guides users through the home search process
- **Interactive Map**: Powered by Leaflet.js with OpenStreetMap data
- **Multiple Criteria**: Filter by price range, property type, commute distance, and amenities
- **Neighborhood Mode**: Transition from broad area search to detailed block-level exploration
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Zero Dependencies**: Pure HTML, CSS, and JavaScript - no build process required

## How It Works

### Step 1: Choose Your Area
Start by selecting the general region where you want to search for a home.

### Step 2: Set Your Criteria
Define your requirements:
- Price range
- Property type (house, condo, townhouse)
- Number of bedrooms and bathrooms
- Square footage

### Step 3: Location Preferences
Add proximity preferences:
- Commute location
- Maximum commute time
- Nearby amenities (schools, parks, shopping)

### Step 4: Review & Refine
Review your criteria and see the filtered results on the map.

### Step 5: Neighborhood Explorer
Zoom into specific neighborhoods and blocks to find your perfect location.

## Quick Start

### Option 1: Open Directly
Simply open `index.html` in your web browser.

### Option 2: Local Server
```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js
npx http-server
```

Then visit `http://localhost:8000`

## Deployment

### GitHub Pages
1. Push this repository to GitHub
2. Go to Settings > Pages
3. Select branch and `/` root folder
4. Your site will be live at `https://yourusername.github.io/home-buyer-map`

### Netlify
1. Drag and drop the project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your Git repository for automatic deployments

### Vercel
```bash
npm i -g vercel
vercel
```

### Any Static Host
Upload all files to any static file hosting service:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Cloudflare Pages

## File Structure

```
home-buyer-map/
├── index.html          # Main application file
├── styles.css          # All styling
├── app.js              # Application logic
├── README.md           # This file
└── package.json        # Project metadata
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## License

MIT License - feel free to use and modify as needed.
