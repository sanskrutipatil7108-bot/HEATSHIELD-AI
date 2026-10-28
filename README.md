# HeatShield AI – Traffic Junction Heat Risk & Smart Duty Planner

HeatShield AI is an operational climate-safety and occupational heat-strain mitigation platform engineered for traffic police, outdoor municipal workers, supervisors, and administrative authorities worldwide.

The platform provides location-independent heat risk assessment, automated shift rotation planning, microclimate monitoring, cooling infrastructure prioritization, and conversational safety guidance with Nugen Intelligence.

---

## 1. Key Features

- **Location-Independent Architecture**: Operates across countries, administrative provinces, districts, cities, rural villages, and individual road intersections. Pune demonstration data is provided as initial reference, but no module is restricted to any single city.
- **Global Location Selector & Geocoding**: Resolve locations by name, district, or postal region via OpenStreetMap Nominatim, or input custom geographic coordinates (latitude and longitude) with verified/manual data quality badges.
- **Live Global Weather NWP Integration**: Connects dynamically with Open-Meteo Global Numerical Weather Prediction (NWP) models using coordinate-based lookups, with graceful and transparently labeled offline fallback models.
- **Empirical Heat-Risk Model**:
  - Implements the standard Rothfusz Heat Index equation converted to Celsius.
  - Outdoor Wet-Bulb Globe Temperature (WBGT) Liljegren approximation synthesizing solar radiation and wind convection.
  - Transparent 0–100 score accounting for ambient temperature, humidity evaporative suppression, direct solar vs. shaded canopy exposure, asphalt re-radiation, vehicular idling heat, and continuous shift duration.
- **Universal Smart Duty Planner**:
  - Personnel roster management with vulnerability tags (standard, heat-sensitized, high vulnerability).
  - Shift scheduling and continuous outdoor exposure tracking.
  - 1-click **Heat-Safe Duty Rotation Optimizer** that caps continuous stints and schedules mandatory shaded hydration intervals.
  - Full CSV roster export for daily shift rollouts and risk audits.
- **Interactive Global Heat Map**:
  - Powered by Leaflet with CartoDB Dark Matter tiles.
  - Real-time risk color-coded markers (Green: Low, Amber: Moderate, Orange: High, Red: Extreme).
  - Click-on-map to inspect microclimates or register new junction checkpoints at precise coordinates.
- **Cooling Infrastructure Prioritization**:
  - Register and manage shade canopies, misting fans, 20L chilled electrolyte water dispensers, and modular cooling respite pods.
  - Transparent priority rank calculation: $\text{Priority} = f(\text{Risk Score}, \text{Shade Deficit}, \text{Water Access})$.
- **Nugen AI Safety Assistant**:
  - Backend proxy on `/api/nugen/chat` supporting live inference via [docs.nugen.in](https://docs.nugen.in/) when `NUGEN_API_KEY` is configured.
  - Offline domain-expert rule engine when unconfigured, providing urgent-care heatstroke first-aid and hydration protocols without fake connection indicators.
- **Multi-Tenant Organization Policies**:
  - Configurable policy limits: maximum continuous exposure minutes in high heat, minimum rest intervals, and emergency dispatch phone numbers.

---

## 2. Configuration & Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# GEMINI_API_KEY: Optional Gemini API Key
GEMINI_API_KEY="your-gemini-key"

# NUGEN_API_KEY: Optional API key for Nugen Intelligence (https://docs.nugen.in/)
# When omitted, HeatShield AI automatically operates in clear Demo Safety Assistant mode.
NUGEN_API_KEY=""

# NUGEN_BASE_URL: Custom base URL for Nugen API (defaults to https://api.nugen.in/v1)
NUGEN_BASE_URL="https://api.nugen.in/v1"

# PORT: Server port (defaults to 3000)
PORT=3000
```

---

## 3. Running Locally

Install dependencies:
```bash
npm install
```

Start full-stack development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm run start
```

---

## 4. Scientific & Operational Limitations

1. **Demonstration Index**: The 0–100 heat risk score is an empirical demonstration metric designed for operational planning and comparative risk ranking.
2. **Not a Medical Certification**: The platform and AI assistant provide occupational first-aid guidelines (WHO/OSHA/ACGIH). They do not certify individual medical fitness or diagnose cardiovascular conditions.
3. **Data Source Transparency**: Live weather readings, user-entered manual readings, and simulated fallback estimates are always explicitly labeled with source attribution and observation timestamps.
