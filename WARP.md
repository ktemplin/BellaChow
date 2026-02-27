# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Chow Bella** is a smart grocery assistant application that helps users find local deals from grocery store flyers and suggests recipes based on on-sale ingredients. The project uses a hybrid tech stack combining Next.js/React for the frontend and Python (FastAPI) for the backend flyer scraping services.

## Architecture

### Frontend (Next.js/React)
- **Framework**: Next.js 15.4.1 with React 19, TypeScript
- **Styling**: Tailwind CSS 4.0 
- **Map Integration**: React Leaflet for interactive store maps
- **Main Components**:
  - `src/app/page.tsx` - Main application with location search, store discovery, and grocery list management
  - `src/app/Map.tsx` - Interactive map component showing user location and nearby stores  
  - `src/app/layout.tsx` - Root layout with theme switcher and global fonts

### Backend (Python)
- **Framework**: FastAPI for API services
- **Location**: `src/app/` directory (mixed with frontend)
- **Core Files**:
  - `flyer_api.py` - FastAPI server exposing `/api/flyers` endpoint
  - `flyer_sources.py` - Flyer scraping logic with support for multiple sources (currently Flipp)

### AWS Amplify Integration
- **Auth**: Email-based authentication configured in `amplify/auth/resource.ts`
- **Data**: Basic Todo model schema in `amplify/data/resource.ts` (placeholder)
- **Backend**: Amplify backend configuration in `amplify/backend.ts`

### Data Flow
1. Frontend requests user location or accepts search input
2. Uses OpenStreetMap/Overpass API to find nearby grocery stores
3. Displays stores on interactive map with Leaflet
4. Calls Python backend at `localhost:8000/api/flyers` to fetch store deals
5. Allows users to build grocery lists and view specials per store

## Common Development Commands

### Frontend Development
```bash
# Start Next.js development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

### Backend Development
```bash
# Run FastAPI server (from project root)
# Note: No specific Python requirements.txt exists yet
python src/app/flyer_api.py

# Or use uvicorn for development
uvicorn src.app.flyer_api:app --reload --port 8000
```

### AWS Amplify
```bash
# Deploy Amplify backend
npx ampx deploy

# Generate Amplify client types
npx ampx generate types
```

## Key Development Notes

### Location Services
- App relies on browser geolocation API and OpenStreetMap services
- HTTPS required for geolocation; shows warning on HTTP
- Fallback to manual location search via Nominatim geocoding API
- Store data fetched from Overpass API (OpenStreetMap's query interface)

### Map Implementation  
- Uses React Leaflet with custom marker icons
- Dynamic imports (`next/dynamic`) to avoid SSR issues
- Map centers on user location with configurable radius (1-10 miles)
- Store markers clickable to show details panel

### State Management
- Uses React hooks for local state (no Redux/Zustand)
- Key state: user position, nearby stores, selected store, grocery list
- Pagination for store listings (10 stores per page)

### API Integration
- Frontend expects Python backend at `localhost:8000`
- Backend uses modular `FlyerSource` classes for different data sources
- Currently implements Flipp source; designed for easy extension
- Deduplication logic for items from multiple sources

### Styling Architecture
- Tailwind CSS with dark mode support
- Theme switcher in layout affects entire app
- Responsive design with mobile-first approach
- Custom styling for map container and store detail panels

## Development Environment Setup

1. **Install Dependencies**: `npm install`
2. **Environment**: Ensure HTTPS for geolocation or use localhost
3. **Backend**: Set up Python environment and install FastAPI, requests
4. **Maps**: Leaflet CSS automatically imported via React Leaflet
5. **AWS**: Configure Amplify CLI if deploying backend services

## Testing Strategy

Currently no test files exist. Recommended approach:
- **Frontend**: Jest + React Testing Library for component tests  
- **Backend**: pytest for Python API tests
- **E2E**: Playwright for full user workflows
- **Map**: Mock geolocation and API responses for reliable testing

## Data Sources & APIs

- **Store Locations**: Overpass API (OpenStreetMap data)
- **Geocoding**: Nominatim (OpenStreetMap)  
- **Flyer Data**: Flipp API (via Python backend)
- **Maps**: OpenStreetMap tiles via Leaflet

## Future Development Areas

Based on the README roadmap:
- Recipe suggestion integration (OpenAI/Hugging Face)
- Price tracking database (CockroachDB mentioned)
- User authentication and profiles  
- Subscription/verification system for free tier
- Mobile optimization and PWA features
