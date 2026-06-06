import { useState, useRef, useEffect } from 'react';
import './App.css';
import { fetchLiveWeather, requestAiSuggestion } from './lib/backendApi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Weather {
  location: string;
  temperature: number;
  rainProbability: number;
  windSpeed: number;
  uvIndex: number;
  forecast: string;
  latitude?: number;
  longitude?: number;
}

interface CheckItem { label: string; pass: boolean; value: string; }

interface Analysis {
  intent: string;
  safetyScore: number;
  checklist: CheckItem[];
  directAnswer: string;
  explanation: string;
  recommendation: string;
}

interface Message {
  id: string;
  from: 'user' | 'bot';
  text: string;
  time: string;
  analysis?: Analysis;
}

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const BrandIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary)' }}>
    <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.3.27A7 7 0 1 0 3 15.5c0 1.93 1.57 3.5 3.5 3.5h11z" fill="currentColor" fillOpacity="0.12"/>
    <path d="M12 10v4M10 12h4" strokeLinecap="round"/>
  </svg>
);

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary)' }}>
    <rect x="3" y="11" width="18" height="10" rx="2" fill="currentColor" fillOpacity="0.1"/>
    <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
    <path d="M9 19.5c1.5.8 4.5.8 6 0M12 2v3M9 5h6" strokeLinecap="round"/>
  </svg>
);

const UserAvatarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-muted)' }}>
    <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.1"/>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  </svg>
);

const SunIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="anim-spin">
    <circle cx="12" cy="12" r="4" fill="#f59e0b" fillOpacity="0.2"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round"/>
  </svg>
);

const RainIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 16.5a4 4 0 0 0 0-8h-.7a7 7 0 1 0-12 5.5" stroke="#94a3b8" className="anim-cloud" fill="#94a3b8" fillOpacity="0.1"/>
    <path d="M8 17v2" stroke="#3b82f6" className="anim-rain-1" strokeLinecap="round"/>
    <path d="M12 17v2" stroke="#3b82f6" className="anim-rain-2" strokeLinecap="round"/>
    <path d="M16 17v2" stroke="#3b82f6" className="anim-rain-3" strokeLinecap="round"/>
  </svg>
);

const WindIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" strokeLinecap="round"/>
  </svg>
);

const CloudIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="anim-cloud">
    <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.3.27A7 7 0 1 0 3 15.5c0 1.93 1.57 3.5 3.5 3.5h11z" fill="currentColor" fillOpacity="0.1"/>
  </svg>
);

const weatherIcon = (f: string) => {
  if (f === 'Sunny') return <SunIcon />;
  if (f === 'Showers' || f === 'Thunderstorm') return <RainIcon />;
  if (f === 'Windy') return <WindIcon />;
  return <CloudIcon />;
};

const OSM_TILE_SERVER = 'https://tile.openstreetmap.org';

function lonToTile(lon: number, zoom: number) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

function latToTile(lat: number, zoom: number) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

function getMapTiles(lat: number, lon: number, zoom: number) {
  const size = 1;
  const tiles: Array<{ x: number; y: number; url: string }> = [];
  const centerX = lonToTile(lon, zoom);
  const centerY = latToTile(lat, zoom);
  const maxIndex = Math.pow(2, zoom);

  for (let dy = -size; dy <= size; dy++) {
    for (let dx = -size; dx <= size; dx++) {
      const x = ((centerX + dx) % maxIndex + maxIndex) % maxIndex;
      const y = Math.min(Math.max(centerY + dy, 0), maxIndex - 1);
      tiles.push({ x, y, url: `${OSM_TILE_SERVER}/${zoom}/${x}/${y}.png` });
    }
  }

  return tiles;
}

async function fetchLocationCoordinates(location: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to retrieve location from OpenStreetMap.');
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Location not found.');
  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Nairobi — Farming Highlands', location: 'Nairobi, Kenya', latitude: -1.2921, longitude: 36.8219 },
  { label: 'Miami — Coastal Beach', location: 'Miami, FL, USA', latitude: 25.7617, longitude: -80.1918 },
  { label: 'Cape Town — Windy Ridge', location: 'Cape Town, South Africa', latitude: -33.9249, longitude: 18.4241 },
  { label: 'London — Chilly Storm', location: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
] as const;

const SUGGESTIONS = [
  { label: '🌾 Maize Planting', q: 'Can I plant maize this weekend?' },
  { label: '🏖️ Beach Trip',    q: 'Should I go to the beach this weekend?' },
  { label: '🏃 Running',        q: 'Is it a good day to run outdoors?' },
  { label: '🎨 Fence Painting', q: 'Can I paint my garden fence today?' },
  { label: '🚜 Crop Spraying',  q: 'Is it safe to spray pesticides on my crops today?' },
  { label: '🚗 Car Wash',       q: 'Should I wash my car today?' },
];

// ─── Decision Engine ──────────────────────────────────────────────────────────
function analyze(query: string, w: Weather): Analysis {
  const q = query.toLowerCase();
  let intent = 'Daily Planning', directAnswer = '', explanation = '', recommendation = '';
  let safetyScore = 80;
  let checklist: CheckItem[] = [];

  if (q.includes('plant') || q.includes('maize') || q.includes('farm') || q.includes('seed') || q.includes('crop') || q.includes('spray') || q.includes('pesticide')) {
    intent = 'Agriculture & Farming';
    const isSpraying = q.includes('spray') || q.includes('pesticide');
    if (isSpraying) {
      const windOk = w.windSpeed <= 20, rainOk = w.rainProbability <= 25, tempOk = w.temperature >= 10 && w.temperature <= 32;
      checklist = [
        { label: 'Wind Speed (max 20 km/h)', pass: windOk, value: `${w.windSpeed} km/h` },
        { label: 'Rain Probability (max 25%)', pass: rainOk, value: `${w.rainProbability}%` },
        { label: 'Temperature (10°C – 32°C)', pass: tempOk, value: `${w.temperature}°C` },
      ];
      safetyScore = (windOk ? 40 : 0) + (rainOk ? 40 : 0) + (tempOk ? 20 : 0);
      if (windOk && rainOk && tempOk) {
        directAnswer = 'Conditions are safe to apply crop sprays.';
        explanation = `Wind at ${w.windSpeed} km/h minimises drift risk and low rain probability keeps the treatment effective.`;
        recommendation = 'Proceed with spraying. Best window: next 4 hours.';
      } else {
        directAnswer = 'Postpone crop spraying today.';
        const r: string[] = [];
        if (!windOk) r.push(`high wind (${w.windSpeed} km/h)`);
        if (!rainOk)  r.push(`rain risk (${w.rainProbability}%)`);
        if (!tempOk)  r.push(`unfavourable temp (${w.temperature}°C)`);
        explanation = `Spraying is risky due to ${r.join(', ')}.`;
        recommendation = 'Wait for calm, dry conditions — wind < 20 km/h and rain < 25%.';
      }
    } else {
      const rainOk = w.rainProbability >= 30 && w.rainProbability <= 80;
      const stormRisk = w.rainProbability > 85;
      const tempOk = w.temperature >= 15 && w.temperature <= 32;
      checklist = [
        { label: 'Soil Moisture — Rain (30–80%)', pass: rainOk && !stormRisk, value: `${w.rainProbability}%` },
        { label: 'No Severe Storm Risk',          pass: !stormRisk, value: w.forecast },
        { label: 'Germination Temp (15–32°C)',    pass: tempOk,     value: `${w.temperature}°C` },
      ];
      safetyScore = (rainOk && !stormRisk ? 40 : 15) + (!stormRisk ? 40 : 0) + (tempOk ? 20 : 0);
      if (!tempOk) {
        directAnswer = 'Temperatures are unfavourable for planting.';
        explanation = w.temperature < 15 ? `Too chilly (${w.temperature}°C) for germination.` : `Extreme heat (${w.temperature}°C) will stress seedlings.`;
        recommendation = 'Hold off until temperature is between 15°C and 32°C.';
      } else if (stormRisk) {
        directAnswer = 'Do not plant seeds this weekend.';
        explanation = 'Heavy storm risk will wash seeds away and erode topsoil.';
        recommendation = 'Wait for storm alerts to clear before planting.';
      } else if (rainOk) {
        directAnswer = 'Rain is expected over the weekend, providing good soil moisture.';
        explanation = 'Planting maize during this period is favorable.';
        recommendation = 'Recommended planting time:\nSaturday morning.';
      } else {
        directAnswer = 'Planting is possible but supplemental watering is required.';
        explanation = `Low rain probability (${w.rainProbability}%) means dry soil may delay germination.`;
        recommendation = 'Irrigate immediately after sowing if planting today.';
      }
    }
  } else if (q.includes('beach') || q.includes('swim') || q.includes('sunbathe')) {
    intent = 'Travel & Leisure';
    const tempOk = w.temperature >= 23, rainOk = w.rainProbability <= 30, skyOk = ['Sunny', 'Partly Cloudy'].includes(w.forecast);
    checklist = [
      { label: 'Warm Temp (min 23°C)',    pass: tempOk, value: `${w.temperature}°C` },
      { label: 'Low Rain (max 30%)',       pass: rainOk, value: `${w.rainProbability}%` },
      { label: 'Good Sky Conditions',      pass: skyOk,  value: w.forecast },
    ];
    safetyScore = (tempOk ? 45 : 10) + (rainOk ? 45 : 0) + (skyOk ? 10 : 0);
    if (tempOk && rainOk && skyOk) {
      directAnswer = 'Sunny conditions with low rainfall are expected.';
      explanation = 'This is a great time for beach activities.';
      recommendation = w.uvIndex >= 7 ? `Ideal for travel and outdoor plans.\nApply sunscreen — UV index is ${w.uvIndex}.` : 'Ideal for travel and outdoor plans.';
    } else {
      directAnswer = 'Conditions are unfavourable for the beach.';
      const f: string[] = [];
      if (!tempOk) f.push(`cold temp (${w.temperature}°C)`);
      if (!rainOk)  f.push(`high rain chance (${w.rainProbability}%)`);
      if (!skyOk)   f.push(`gloomy sky (${w.forecast})`);
      explanation = `Beach plans are impacted by ${f.join(', ')}.`;
      recommendation = 'Consider indoor recreation or reschedule to a warmer day.';
    }
  } else if (q.includes('run') || q.includes('sport') || q.includes('hike') || q.includes('marathon')) {
    intent = 'Sports & Outdoors';
    const tempOk = w.temperature >= 8 && w.temperature <= 28, rainOk = w.rainProbability <= 50, windOk = w.windSpeed <= 35;
    checklist = [
      { label: 'Comfortable Temp (8–28°C)', pass: tempOk, value: `${w.temperature}°C` },
      { label: 'Low Rain (max 50%)',         pass: rainOk, value: `${w.rainProbability}%` },
      { label: 'Safe Wind (max 35 km/h)',    pass: windOk, value: `${w.windSpeed} km/h` },
    ];
    safetyScore = (tempOk ? 40 : 10) + (rainOk ? 40 : 10) + (windOk ? 20 : 0);
    if (tempOk && rainOk && windOk) {
      directAnswer = 'Weather conditions are ideal for outdoor training.';
      explanation = `Moderate temperature of ${w.temperature}°C and low rain risk make for comfortable cardio.`;
      recommendation = 'Favorable for running. Morning or evening slots are best.';
    } else {
      directAnswer = 'Outdoor activity is not advised today.';
      const h: string[] = [];
      if (!tempOk) h.push(w.temperature < 8 ? 'extreme cold' : 'excessive heat');
      if (!rainOk)  h.push('slippery conditions from rain');
      if (!windOk)  h.push('strong winds');
      explanation = `Outdoor sports compromised by ${h.join(', ')}.`;
      recommendation = 'Opt for an indoor gym workout instead.';
    }
  } else if (q.includes('paint') || q.includes('fence') || q.includes('wash') || q.includes('laundry')) {
    intent = 'Home & Errands';
    const rainOk = w.rainProbability <= 20, tempOk = w.temperature >= 12 && w.temperature <= 35;
    const isPainting = q.includes('paint') || q.includes('fence');
    checklist = [
      { label: 'Dry Weather (max 20% rain)', pass: rainOk, value: `${w.rainProbability}%` },
      { label: 'Suitable Temp (12–35°C)',    pass: tempOk, value: `${w.temperature}°C` },
    ];
    safetyScore = (rainOk ? 60 : 0) + (tempOk ? 40 : 10);
    if (isPainting) {
      if (rainOk && tempOk) {
        directAnswer = 'Favourable conditions for outdoor painting.';
        explanation = `Warm temperature (${w.temperature}°C) and no rain allows paint to cure evenly.`;
        recommendation = 'Start painting by 9:00 AM for full daytime drying.';
      } else {
        directAnswer = 'Do not paint outdoors today.';
        explanation = 'Damp or cold weather will ruin paint adhesion and curing.';
        recommendation = 'Reschedule for a clear, dry day.';
      }
    } else {
      if (rainOk) {
        directAnswer = 'Excellent day to hang laundry or wash your car.';
        explanation = `Low precipitation risk (${w.rainProbability}%) and dry air will dry fabrics quickly.`;
        recommendation = 'Hang laundry early — favorable drying window all day.';
      } else {
        directAnswer = 'Postpone washing or hanging laundry outside.';
        explanation = `Rain risk of ${w.rainProbability}% means items will stay damp.`;
        recommendation = 'Use indoor drying racks or wait for a dry weather gap.';
      }
    }
  } else {
    const nice = w.temperature >= 18 && w.temperature <= 26 && w.rainProbability < 40 && w.windSpeed < 30;
    checklist = [
      { label: 'Mild Temp (18–26°C)',    pass: w.temperature >= 18 && w.temperature <= 26, value: `${w.temperature}°C` },
      { label: 'Low Rain (< 40%)',        pass: w.rainProbability < 40, value: `${w.rainProbability}%` },
      { label: 'Gentle Wind (< 30 km/h)', pass: w.windSpeed < 30,      value: `${w.windSpeed} km/h` },
    ];
    safetyScore = nice ? 90 : 60;
    directAnswer = nice ? 'The weather is pleasant for outdoor plans.' : 'Weather conditions are mixed today.';
    explanation = nice
      ? `Comfortable at ${w.temperature}°C with low rain risk.`
      : `Current conditions: ${w.temperature}°C, ${w.rainProbability}% rain, ${w.windSpeed} km/h wind.`;
    recommendation = nice ? 'Great for errands, walks, and outdoor activities.' : 'Plan indoor activities or carry appropriate weather gear.';
  }

  return { intent, safetyScore, checklist, directAnswer, explanation, recommendation };
}

// ─── App ──────────────────────────────────────────────────────────────────────
function getForecastClass(forecast: string) {
  const f = forecast.toLowerCase();
  if (f === 'sunny') return 'bg-sunny';
  if (f === 'showers') return 'bg-showers';
  if (f === 'thunderstorm') return 'bg-thunderstorm';
  if (f === 'windy') return 'bg-windy';
  return 'bg-cloudy';
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('weatherai-theme') === 'dark' ? 'dark' : 'light';
  });

  const [launched, setLaunched] = useState(false);
  const [liveLocation, setLiveLocation] = useState('Nairobi, Kenya');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherSource, setWeatherSource] = useState<'preset' | 'live'>('preset');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapZoom, setMapZoom] = useState(8);
  const [activePanel, setActivePanel] = useState<'simulator' | 'chat' | 'insights'>('chat');
  const aiMode = 'remote';
  const [liveStatus, setLiveStatus] = useState('');
  const [routeStart, setRouteStart] = useState('Nairobi, Kenya');
  const [routeEnd, setRouteEnd] = useState('Mombasa, Kenya');
  const [routeWeather, setRouteWeather] = useState<{ start: Weather | null; end: Weather | null }>({ start: null, end: null });
  const [routeCoords, setRouteCoords] = useState<{ start: { latitude: number; longitude: number }; end: { latitude: number; longitude: number } } | null>(null);
  const [routeStatus, setRouteStatus] = useState('Enter start and end points, then click plan route.');

  // Sandbox state (for landing page teaser)
  const [sandboxTopic, setSandboxTopic] = useState<'farming' | 'beach' | 'painting'>('farming');
  const [sandboxW, setSandboxW] = useState<Weather>({ location: '', temperature: 24, rainProbability: 15, windSpeed: 10, uvIndex: 5, forecast: 'Sunny' });
  const sandboxQuery = sandboxTopic === 'farming' ? 'Can I plant maize this weekend?' : sandboxTopic === 'beach' ? 'Should I go to the beach this weekend?' : 'Can I paint my garden fence today?';
  const sandboxResult = analyze(sandboxQuery, sandboxW);

  const [presetIdx, setPresetIdx] = useState(0);
  const [messages, setMessages] = useState<Message[]>([{
    id: 'init', from: 'bot', time: now(),
    text: 'Hello! I\'m WeatherAI Copilot. Select a location from the presets or fetch live weather, then ask a decision question using the current API-powered forecast.',
  }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('no-transitions');
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('weatherai-theme', theme);
    
    // Force reflow
    void document.documentElement.offsetHeight;
    
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
    }, 50);
    return () => clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  async function loadWeather(location: string, latitude?: number, longitude?: number) {
    setLiveStatus(`Loading weather for ${location}...`);
    try {
      const live = await fetchLiveWeather(location);
      setWeather(live);
      setWeatherSource('live');
      setLiveLocation(location);
      setPresetIdx(PRESETS.findIndex(p => p.location === location));
      const coords = latitude != null && longitude != null
        ? { latitude, longitude }
        : await fetchLocationCoordinates(location);
      setCoordinates(coords);
      setMapZoom(8);
      setLiveStatus(`Live weather loaded for ${live.location}.`);
    } catch (error) {
      setLiveStatus(error instanceof Error ? error.message : 'Failed to load weather.');
    }
  }

  async function selectPreset(i: number) {
    const preset = PRESETS[i];
    setPresetIdx(i);
    setWeatherSource('preset');
    setLiveStatus('Fetching preset weather...');
    await loadWeather(preset.location, preset.latitude, preset.longitude);
  }

  async function loadLiveWeather() {
    await loadWeather(liveLocation);
  }

  async function loadRouteWeather() {
    setRouteStatus('Planning route weather...');
    try {
      const [startData, endData] = await Promise.all([
        fetchLiveWeather(routeStart),
        fetchLiveWeather(routeEnd),
      ]);
      const [startCoords, endCoords] = await Promise.all([
        fetchLocationCoordinates(routeStart),
        fetchLocationCoordinates(routeEnd),
      ]);
      setRouteWeather({ start: startData, end: endData });
      setRouteCoords({ start: startCoords, end: endCoords });
      setRouteStatus(`Route weather loaded for ${startData.location} → ${endData.location}.`);
    } catch (error) {
      setRouteStatus(error instanceof Error ? error.message : 'Failed to load route weather.');
    }
  }

  useEffect(() => {
    loadWeather(PRESETS[0].location, PRESETS[0].latitude, PRESETS[0].longitude);
  }, []);

  async function sendMessage(q: string) {
    if (!q.trim() || !weather) return;
    setMessages(p => [...p, { id: Date.now().toString(), from: 'user', text: q, time: now() }]);
    setInput('');
    setThinking(true);

    const analysis = analyze(q, weather);
    setLastAnalysis(analysis);

    let remoteText: string | null = null;
    if (aiMode === 'remote') {
      try {
        remoteText = await requestAiSuggestion(q, weather);
      } catch (error) {
        console.warn('AI suggestion request failed, falling back to local analysis:', error);
      }
    }

    setMessages(p => [...p, { id: (Date.now() + 1).toString(), from: 'bot', text: remoteText || analysis.directAnswer, time: now(), analysis }]);
    setThinking(false);
  }

  // ── COPILOT DASHBOARD VIEW ──────────────────────────────────────────────────
  if (launched && !weather) {
    return (
      <div className="app-page loading-screen">
        <div className="loading-box">
          <h2>Loading live weather...</h2>
          <p>{liveStatus || 'Connecting to the WeatherAI API.'}</p>
          <button className="btn btn-primary" onClick={() => loadWeather(liveLocation)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (launched && weather) return (
    <div className={`app-page ${getForecastClass(weather.forecast)}`}>
      {/* Background blobs */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      {/* ─── Header ─── */}
      <header className="app-header">
        <div className="app-header-top">
          <button className="app-back-btn" onClick={() => setLaunched(false)}>
            ← Landing
          </button>
          <div className="divider-v" />
          <div className="app-header-brand">
            <BrandIcon />
            WeatherAI Copilot
          </div>
          <div className="spacer" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="status-dot" />
            <span className="status-label">System Active</span>
          </div>
          <button className="theme-toggle" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </header>

      {/* ─── Preset Tabs ─── */}
      <div className="preset-tabs">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            className={`preset-tab ${presetIdx === i ? 'active' : ''}`}
            onClick={() => selectPreset(i)}
          >
            <span className="preset-tab-dot" />
            {p.label}
          </button>
        ))}
      </div>

      {/* ─── Grid ─── */}
      <div className="app-grid">

        {/* ── Simulator Panel ── */}
        <div className={`app-panel app-simulator ${activePanel === 'simulator' ? 'active-mobile' : ''}`}>
          <div className="panel-header">
            <div className="panel-header-icon">🌡️</div>
            <div>
              <div className="panel-title">Weather Dashboard</div>
              <div className="panel-desc">All conditions are loaded from the WeatherAI API in real time.</div>
            </div>
          </div>

          <div className="sim-body">
            {/* Location chip */}
            <div className="location-chip">
              <div>{weather ? weatherIcon(weather.forecast) : <CloudIcon />}</div>
              <div className="location-chip-labels">
                <div className="location-source-badge">
                  {weatherSource === 'live' ? '📡 Live Location' : '📍 Preset Location'}
                </div>
                <div className="location-name">{weather?.location || 'Fetching weather...'}</div>
                <div className="location-forecast">{weather ? `${weather.forecast} · ${weather.temperature}°C` : 'Waiting for API data'}</div>
              </div>
            </div>

            {/* Live weather block */}
            <div className="live-block">
              <div className="live-block-header">
                <span className="live-block-label">Live Weather Fetch</span>
                <span className="live-source-badge">
                  {weatherSource === 'live' ? '● Live' : '○ Simulated'}
                </span>
              </div>
              <div className="live-input-row">
                <input
                  className="chat-input"
                  value={liveLocation}
                  onChange={e => setLiveLocation(e.target.value)}
                  placeholder="City or region…"
                  style={{ flex: 1, height: 36, fontSize: 13 }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={loadLiveWeather}
                  style={{ height: 36, flexShrink: 0 }}
                >
                  Fetch
                </button>
              </div>
              <div className="live-status-text">
                {liveStatus || 'Powered by the Django backend service.'}
              </div>
            </div>

            {/* OpenStreetMap location preview */}
            <div className="map-block">
              <div className="map-block-header">
                <div>
                  <div className="panel-title">Location Map</div>
                  <div className="panel-desc">OpenStreetMap tiles show the current location context.</div>
                </div>
                <div className="map-toolbar">
                  <button className="map-zoom-btn" onClick={() => setMapZoom(z => Math.max(3, z - 1))}>-</button>
                  <span>{mapZoom}</span>
                  <button className="map-zoom-btn" onClick={() => setMapZoom(z => Math.min(14, z + 1))}>+</button>
                </div>
              </div>
              {coordinates ? (
                <div className="map-window">
                  <div className="map-grid">
                    {getMapTiles(coordinates.latitude, coordinates.longitude, mapZoom).map((tile, idx) => (
                      <img key={idx} src={tile.url} alt={`OSM tile ${tile.x}/${tile.y}`} className="map-tile" />
                    ))}
                  </div>
                  <div className="map-marker" title="Current location" />
                  <div className="map-meta">
                    <div>{weather?.location || liveLocation}</div>
                    <div>{coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</div>
                  </div>
                </div>
              ) : (
                <div className="map-fallback">Choose a preset or fetch live weather to view the OpenStreetMap location.</div>
              )}
            </div>

            <div className="weather-summary-block">
              <div className="panel-header">
                <div className="panel-header-icon">📌</div>
                <div>
                  <div className="panel-title">Current Conditions</div>
                  <div className="panel-desc">Live values from the WeatherAI API drive every decision.</div>
                </div>
              </div>
              <div className="weather-stats-grid">
                {weather ? [
                  { label: 'Temperature', value: `${weather.temperature}°C`, hint: 'Air temperature' },
                  { label: 'Rain chance', value: `${weather.rainProbability}%`, hint: 'Precipitation likelihood' },
                  { label: 'Wind speed', value: `${weather.windSpeed} km/h`, hint: 'Surface wind' },
                  { label: 'UV index', value: `${weather.uvIndex}`, hint: 'Sun exposure risk' },
                ].map((stat, idx) => (
                  <div className="weather-stat" key={idx}>
                    <div className="weather-stat-label">{stat.label}</div>
                    <div className="weather-stat-value">{stat.value}</div>
                    <div className="weather-stat-hint">{stat.hint}</div>
                  </div>
                )) : (
                  <div className="weather-summary-empty">Live weather is loading from the WeatherAI API.</div>
                )}
              </div>
            </div>

            <div className="route-block">
              <div className="panel-header">
                <div className="panel-header-icon">🗺️</div>
                <div>
                  <div className="panel-title">Route Planner</div>
                  <div className="panel-desc">Compare weather at each waypoint and preview route conditions.</div>
                </div>
              </div>

              <div className="route-input-grid">
                <div className="route-input-group">
                  <label>Start</label>
                  <input
                    className="chat-input"
                    value={routeStart}
                    onChange={e => setRouteStart(e.target.value)}
                    placeholder="Start location"
                  />
                </div>
                <div className="route-input-group">
                  <label>End</label>
                  <input
                    className="chat-input"
                    value={routeEnd}
                    onChange={e => setRouteEnd(e.target.value)}
                    placeholder="End location"
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm route-plan-btn"
                  onClick={loadRouteWeather}
                >
                  Plan Route
                </button>
              </div>

              <div className="route-status-text">{routeStatus}</div>

              {routeWeather.start && routeWeather.end && routeCoords ? (
                <>
                  <div className="route-summary-grid">
                    {[
                      { label: 'Start', data: routeWeather.start, coords: routeCoords.start },
                      { label: 'End', data: routeWeather.end, coords: routeCoords.end },
                    ].map(segment => (
                      <div key={segment.label} className="route-card">
                        <div className="route-card-title">{segment.label}</div>
                        <div className="route-card-location">{segment.data.location}</div>
                        <div className="route-card-metrics">
                          <span>{segment.data.forecast}</span>
                          <span>{segment.data.temperature}°C</span>
                          <span>{segment.data.rainProbability}% rain</span>
                        </div>
                        <div className="route-card-coords">{segment.coords.latitude.toFixed(3)}, {segment.coords.longitude.toFixed(3)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="route-map-row">
                    {[
                      { label: 'Start', coords: routeCoords.start },
                      { label: 'End', coords: routeCoords.end },
                    ].map(pin => (
                      <div key={pin.label} className="route-mini-map">
                        <div className="route-mini-map-title">{pin.label}</div>
                        <div className="map-window">
                          <div className="map-grid">
                            {getMapTiles(pin.coords.latitude, pin.coords.longitude, Math.min(mapZoom + 2, 14)).map((tile, idx) => (
                              <img key={idx} src={tile.url} alt={`${pin.label} tile ${tile.x}/${tile.y}`} className="map-tile" />
                            ))}
                          </div>
                          <div className="map-marker" title={pin.label} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div className={`app-panel app-chat ${activePanel === 'chat' ? 'active-mobile' : ''}`}>


          {/* Message feed */}
          <div className="chat-feed" ref={chatRef}>
            {messages.map(msg => (
              <div key={msg.id} className={`chat-row-full anim-msg ${msg.from}`}>
                <div
                  className="chat-avatar-lg"
                  style={{ background: msg.from === 'bot' ? 'var(--color-primary-light)' : 'var(--color-bg-soft)' }}
                >
                  {msg.from === 'bot' ? <BotIcon /> : <UserAvatarIcon />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <div className="chat-bubble-full">
                    {msg.analysis ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <span className="bot-msg-intent">
                          🎯 {msg.analysis.intent}
                        </span>
                        <div className="bot-msg-answer">{msg.analysis.directAnswer}</div>
                        <div className="bot-msg-explanation">{msg.analysis.explanation}</div>
                        <div className="bot-msg-rec">{msg.analysis.recommendation}</div>
                      </div>
                    ) : msg.text}
                  </div>
                  <div className="msg-time">{msg.time}</div>
                </div>
              </div>
            ))}

            {thinking && (
              <div className="chat-row-full bot">
                <div className="chat-avatar-lg" style={{ background: 'var(--color-primary-light)' }}>
                  <BotIcon />
                </div>
                <div className="typing-indicator">
                  <div className="typing-dot d1" />
                  <div className="typing-dot d2" />
                  <div className="typing-dot d3" />
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="chat-suggestion-bar">
            <span className="sug-label">Quick Ask:</span>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="sug-btn" onClick={() => sendMessage(s.q)}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask a weather-based decision question…"
              disabled={thinking}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || thinking}
            >
              Analyze →
            </button>
          </div>
        </div>

        {/* ── Decision Audit Panel ── */}
        <div className={`app-panel app-insights ${activePanel === 'insights' ? 'active-mobile' : ''}`}>
          <div className="panel-header">
            <div className="panel-header-icon">📊</div>
            <div>
              <div className="panel-title">Decision Audit</div>
              <div className="panel-desc">Threshold analysis from last query</div>
            </div>
          </div>

          <div className="audit-body">
            {lastAnalysis ? (
              <>
                {/* Intent card */}
                <div className="audit-intent-card">
                  <div className="audit-intent-label">Detected Intent</div>
                  <div className="audit-intent-value">{lastAnalysis.intent}</div>
                </div>

                {/* SVG Safety Gauge */}
                <div className="audit-gauge-container">
                  <svg width="140" height="140" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent"
                      stroke="var(--color-border)" strokeWidth="9" />
                    <circle cx="50" cy="50" r="40" fill="transparent"
                      stroke={
                        lastAnalysis.safetyScore >= 75 ? 'rgba(16,185,129,0.12)'
                        : lastAnalysis.safetyScore >= 40 ? 'rgba(245,158,11,0.12)'
                        : 'rgba(239,68,68,0.12)'
                      }
                      strokeWidth="18" />
                    <circle cx="50" cy="50" r="40" fill="transparent"
                      stroke={
                        lastAnalysis.safetyScore >= 75 ? 'var(--color-success)'
                        : lastAnalysis.safetyScore >= 40 ? 'var(--color-warning)'
                        : 'var(--color-danger)'
                      }
                      strokeWidth="9"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * lastAnalysis.safetyScore) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1)' }}
                    />
                  </svg>
                  <div className="audit-gauge-value">
                    <span
                      className="gauge-number"
                      style={{
                        color: lastAnalysis.safetyScore >= 75 ? 'var(--color-success)'
                          : lastAnalysis.safetyScore >= 40 ? 'var(--color-warning)'
                          : 'var(--color-danger)'
                      }}
                    >
                      {lastAnalysis.safetyScore}
                    </span>
                    <span className="gauge-label">Safety Score</span>
                  </div>
                </div>

                {/* Checklist */}
                <div className="checklist-section">
                  <div className="checklist-section-title">Parameter Checks</div>
                  {lastAnalysis.checklist.map((c, i) => (
                    <div key={i} className="checklist-item">
                      <span className="checklist-item-label">{c.label}</span>
                      <span className={`pass-badge ${c.pass ? 'pass' : 'fail'}`}>
                        {c.value} {c.pass ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="audit-empty">
                <div className="audit-empty-icon">📋</div>
                <div className="audit-empty-title">No query yet</div>
                <div className="audit-empty-desc">
                  Ask a question in the chat to see the full audit trail with safety scoring and threshold checks.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>{/* /app-grid */}

      {/* Sleek Mobile Bottom Navigation */}
      <div className="mobile-nav">
        <button
          className={`mobile-nav-btn ${activePanel === 'simulator' ? 'active' : ''}`}
          onClick={() => setActivePanel('simulator')}
        >
          <span className="mobile-nav-icon">🎛️</span>
          <span className="mobile-nav-label">Simulator</span>
        </button>
        <button
          className={`mobile-nav-btn ${activePanel === 'chat' ? 'active' : ''}`}
          onClick={() => setActivePanel('chat')}
        >
          <span className="mobile-nav-icon">💬</span>
          <span className="mobile-nav-label">Copilot</span>
        </button>
        <button
          className={`mobile-nav-btn ${activePanel === 'insights' ? 'active' : ''}`}
          onClick={() => setActivePanel('insights')}
        >
          <span className="mobile-nav-icon">📊</span>
          <span className="mobile-nav-label">Audit</span>
        </button>
      </div>
    </div>
  );


  // ── LANDING PAGE ─────────────────────────────────────────────────────────────
  return (
    <div className="page-wrap">
      {/* Decorative particles / blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            <div className="navbar-brand">
              <BrandIcon />
              WeatherAI Copilot
            </div>
            <ul className="navbar-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#demo">Sandbox Demo</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
            </ul>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className="theme-toggle" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setLaunched(true)}>
                Launch Copilot →
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-inner">
            {/* Left: text */}
            <div>
              <div className="hero-badge">⚡ Next-Gen Meteorology Intelligence</div>
              <h1 className="hero-title">
                Weather Decisions,<br />
                <span className="gradient-text">Powered by AI</span>
              </h1>
              <p className="hero-desc">
                WeatherAI Copilot translates atmospheric data into clear, actionable advice. Plan planting cycles, beach trips, fitness sessions, and home maintenance with OpenStreetMap-backed location context.
              </p>
              <div className="hero-ctas">
                <button className="btn btn-primary" onClick={() => setLaunched(true)}>Get Started Free</button>
                <a href="#demo" className="btn btn-outline">Try Live Sandbox</a>
              </div>
            </div>

            {/* Right: floating mock chat card */}
            <div className="anim-float">
              <div className="hero-card">
                <div className="hero-card-badge">Farming Intent Matched</div>
                {/* User message */}
                <div className="chat-row user-row">
                  <div className="chat-avatar"><UserAvatarIcon /></div>
                  <div className="chat-bubble user-bubble">Can I plant maize this weekend?</div>
                </div>
                {/* Bot message */}
                <div className="chat-row">
                  <div className="chat-avatar" style={{ background: 'var(--color-primary-light)' }}><BotIcon /></div>
                  <div className="chat-bubble bot-bubble">
                    <div className="answer">Rain is expected over the weekend, providing good soil moisture.</div>
                    <div style={{ color: 'var(--color-text)' }}>Planting maize during this period is favorable.</div>
                    <div className="recommendation">Recommended planting time:<br />Saturday morning.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="section-label">Intelligent Domains</span>
            <h2 className="section-title">Designed for Real-World Decisions</h2>
            <p className="section-desc">Data is meaningless without direction. WeatherAI focuses on the outcomes of your day — not just numbers and charts.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: '🌾', title: 'Farming & Agriculture', color: '#d1fae5', iconColor: '#10b981', desc: 'Determine optimal planting times based on moisture trends, and check wind-safety limits before spraying crops.' },
              { icon: '🏖️', title: 'Travel & Leisure',      color: '#fef3c7', iconColor: '#f59e0b', desc: 'Validate beach conditions, flag high UV index days, and explore routes with OpenStreetMap-backed location context.' },
              { icon: '🏃', title: 'Sports & Training',     color: '#dbeafe', iconColor: '#6366f1', desc: 'Check temperature ranges, precipitation hazards, and wind to keep your running, hiking, and sports sessions safe.' },
              { icon: '🏠', title: 'Home & Maintenance',    color: '#f3e8ff', iconColor: '#7c3aed', desc: 'Verify moisture thresholds before painting walls, check drying windows for laundry, and plan outdoor projects.' },
            ].map(f => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon-wrap" style={{ backgroundColor: theme === 'light' ? f.color : 'rgba(255, 255, 255, 0.04)', border: theme === 'light' ? 'none' : `1.5px solid ${f.iconColor}` }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sandbox Demo ── */}
      <section id="demo" className="section">
        <div className="container">
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <span className="section-label">Interactive Teaser</span>
            <h2 className="section-title">Tweak the Sandbox. Witness the Decision.</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>Slide the controls to adjust simulated weather conditions and watch the AI recommendation update instantly.</p>
          </div>
          <div className="sandbox-grid">
            {/* Controls */}
            <div className="sandbox-panel">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 12 }}>1. Select Your Query</div>
                <div className="sandbox-topic-row">
                  {(['farming', 'beach', 'painting'] as const).map(t => (
                    <button key={t} className={`topic-btn ${sandboxTopic === t ? 'active' : ''}`} onClick={() => setSandboxTopic(t)}>
                      {t === 'farming' ? '🌾 Maize Planting' : t === 'beach' ? '🏖️ Beach Trip' : '🎨 Wall Painting'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 16 }}>2. Tune Environment</div>
                <div className="slider-group">
                  {[
                    { label: 'Rain Probability', key: 'rainProbability' as const, min: 0, max: 100, unit: '%' },
                    { label: 'Temperature',      key: 'temperature'    as const, min: -10, max: 45, unit: '°C' },
                    { label: 'Wind Speed',       key: 'windSpeed'      as const, min: 0, max: 80, unit: ' km/h' },
                  ].map(({ label, key, min, max, unit }) => (
                    <div className="slider-row" key={key}>
                      <div className="slider-label-row">
                        <span className="slider-label">{label}</span>
                        <span className="slider-value">{sandboxW[key]}{unit}</span>
                      </div>
                      <input type="range" min={min} max={max} value={sandboxW[key]}
                        onChange={e => setSandboxW(p => ({ ...p, [key]: parseInt(e.target.value) }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Result card */}
            <div className="result-card">
              <div className="result-header">
                <div className="result-header-left">
                  <BotIcon />
                  WeatherAI Recommendation
                </div>
                <span className="intent-tag">{sandboxResult.intent}</span>
              </div>
              <div className="result-answer">{sandboxResult.directAnswer}</div>
              <div className="result-explanation">{sandboxResult.explanation}</div>
              <div className="result-rec">{sandboxResult.recommendation}</div>
              
              <div className="audit-gauge-container">
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="var(--color-border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={
                      sandboxResult.safetyScore >= 75
                        ? 'var(--color-success)'
                        : sandboxResult.safetyScore >= 40
                        ? 'var(--color-warning)'
                        : 'var(--color-danger)'
                    }
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * sandboxResult.safetyScore) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </svg>
                <div className="audit-gauge-value" style={{ fontSize: '20px' }}>
                  <span style={{ color: sandboxResult.safetyScore >= 75 ? 'var(--color-success)' : sandboxResult.safetyScore >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                    {sandboxResult.safetyScore}%
                  </span>
                  <span className="audit-gauge-label">Safety</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="section-label">Trusted User Voice</span>
            <h2 className="section-title">Loved by Action-Takers</h2>
            <p className="section-desc">See how farmers, athletes, and contractors use WeatherAI to remove guesswork from their decisions.</p>
          </div>
          <div className="testimonials-grid">
            {[
              { initials: 'EO', name: 'Erick Ouma', role: 'Maize Farmer, Rift Valley', text: '"WeatherAI Copilot checks exact wind-safety parameters and tells us precisely when to spray. We\'ve saved thousands in wasted pesticides since switching."' },
              { initials: 'JH', name: 'Jessica Hansen', role: 'Trail Runner, Cape Town',  text: '"Normal weather apps say \'22 degrees\'. WeatherAI checks crosswind limits and trail moisture, telling me whether my 3-hour run is safe. Outstanding."' },
              { initials: 'ML', name: 'Marcus L.',    role: 'Paint Contractor, Miami',    text: '"We used to cancel shifts prematurely. Now we use the drying constraints on WeatherAI to know exactly when our crew can start painting safely."' },
            ].map(t => (
              <div className="testimonial-card" key={t.initials}>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.initials}</div>
                  <div>
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Make Smarter Weather Decisions?</h2>
            <p className="cta-desc">Open WeatherAI Copilot, tune the simulator, ask your decision question, and get a precise recommendation instantly.</p>
            <button className="btn btn-white" onClick={() => setLaunched(true)} style={{ position: 'relative', zIndex: 1 }}>
              Launch Copilot Free →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="navbar-brand"><BrandIcon /> WeatherAI Copilot</div>
              <p>Making complex weather data clear, context-aware, and actionable for your day-to-day decisions.</p>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#demo">Sandbox Preview</a></li>
                <li><button onClick={() => setLaunched(true)}>Launch Copilot</button></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Resources</div>
              <ul className="footer-links">
                <li><a href="#">Farming Advice</a></li>
                <li><a href="#">Travel Guidelines</a></li>
                <li><a href="#">API Docs</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Community</div>
              <ul className="footer-links">
                <li><a href="https://github.com/Eng-Kiman-ichege/Weather-assistant" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a href="#">Twitter / X</a></li>
                <li><a href="#">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} WeatherAI Copilot. All rights reserved.</span>
            <div className="footer-bottom-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
