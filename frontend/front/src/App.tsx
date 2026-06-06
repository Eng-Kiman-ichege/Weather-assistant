import { useState, useRef, useEffect } from 'react';
import './App.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Weather {
  location: string;
  temperature: number;
  rainProbability: number;
  windSpeed: number;
  uvIndex: number;
  forecast: string;
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

// ─── Data ─────────────────────────────────────────────────────────────────────
const PRESETS: Weather[] = [
  { location: 'Nairobi — Farming Highlands', temperature: 21, rainProbability: 75, windSpeed: 12, uvIndex: 6, forecast: 'Showers' },
  { location: 'Miami — Coastal Beach',       temperature: 31, rainProbability: 10, windSpeed: 14, uvIndex: 10, forecast: 'Sunny' },
  { location: 'Cape Town — Windy Ridge',     temperature: 17, rainProbability: 25, windSpeed: 48, uvIndex: 4,  forecast: 'Windy' },
  { location: 'London — Chilly Storm',       temperature: 8,  rainProbability: 85, windSpeed: 25, uvIndex: 1,  forecast: 'Showers' },
];

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
export default function App() {
  const [launched, setLaunched] = useState(false);

  // Sandbox state (for landing page teaser)
  const [sandboxTopic, setSandboxTopic] = useState<'farming' | 'beach' | 'painting'>('farming');
  const [sandboxW, setSandboxW] = useState<Weather>({ location: '', temperature: 24, rainProbability: 15, windSpeed: 10, uvIndex: 5, forecast: 'Sunny' });
  const sandboxQuery = sandboxTopic === 'farming' ? 'Can I plant maize this weekend?' : sandboxTopic === 'beach' ? 'Should I go to the beach this weekend?' : 'Can I paint my garden fence today?';
  const sandboxResult = analyze(sandboxQuery, sandboxW);

  // App (dashboard) state
  const [weather, setWeather] = useState<Weather>(PRESETS[0]);
  const [presetIdx, setPresetIdx] = useState(0);
  const [messages, setMessages] = useState<Message[]>([{
    id: 'init', from: 'bot', time: now(),
    text: 'Hello! I\'m WeatherAI Copilot. Set your weather conditions using the simulator panel, then ask me any decision question — farming, beach, sports, home errands, and more.',
  }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  function selectPreset(i: number) {
    setPresetIdx(i);
    setWeather(PRESETS[i]);
  }

  function sendMessage(q: string) {
    if (!q.trim()) return;
    setMessages(p => [...p, { id: Date.now().toString(), from: 'user', text: q, time: now() }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const a = analyze(q, weather);
      setLastAnalysis(a);
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), from: 'bot', text: '', time: now(), analysis: a }]);
      setThinking(false);
    }, 800);
  }

  // ── COPILOT DASHBOARD VIEW ──────────────────────────────────────────────────
  if (launched) return (
    <div className="app-page">
      {/* App Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setLaunched(false)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-soft)', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', cursor: 'pointer' }}
          >← Back</button>
          <div style={{ width: 1, height: 24, background: 'var(--color-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrandIcon />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--color-text-heading)' }}>WeatherAI Copilot</span>
          </div>
        </div>

        <div className="preset-pill-row" style={{ display: 'flex' }}>
          {PRESETS.map((p, i) => (
            <button key={i} className={`preset-pill ${presetIdx === i ? 'active' : ''}`} onClick={() => selectPreset(i)}>
              {p.location.split('—')[0].trim()}
            </button>
          ))}
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="app-grid">

        {/* Simulator Panel */}
        <div className="app-panel app-simulator" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sim-header">
            <div className="panel-title">Weather Simulator</div>
            <div className="panel-desc">Adjust parameters to test AI decisions.</div>
          </div>
          <div className="sim-body">
            {/* Location chip */}
            <div className="location-chip">
              <div>{weatherIcon(weather.forecast)}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Simulated Location</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-heading)' }}>{weather.location}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{weather.forecast}</div>
              </div>
            </div>

            {/* Forecast select */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>Forecast State</div>
              <select className="select-field" value={weather.forecast} onChange={e => setWeather(p => ({ ...p, forecast: e.target.value, location: 'Custom Location' }))}>
                <option value="Sunny">☀️ Sunny</option>
                <option value="Partly Cloudy">⛅ Partly Cloudy</option>
                <option value="Showers">🌧️ Showers</option>
                <option value="Thunderstorm">⛈️ Thunderstorm</option>
                <option value="Windy">💨 Windy</option>
              </select>
            </div>

            {/* Sliders */}
            {[
              { label: 'Temperature', key: 'temperature' as const, min: -10, max: 45, unit: '°C' },
              { label: 'Rain Probability', key: 'rainProbability' as const, min: 0, max: 100, unit: '%' },
              { label: 'Wind Speed', key: 'windSpeed' as const, min: 0, max: 80, unit: ' km/h' },
              { label: 'UV Index', key: 'uvIndex' as const, min: 0, max: 12, unit: '' },
            ].map(({ label, key, min, max, unit }) => (
              <div className="slider-row" key={key}>
                <div className="slider-label-row">
                  <span className="slider-label">{label}</span>
                  <span className="slider-value">{weather[key]}{unit}</span>
                </div>
                <input type="range" min={min} max={max} value={weather[key]}
                  onChange={e => setWeather(p => ({ ...p, [key]: parseInt(e.target.value), location: 'Custom Location' }))} />
              </div>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="app-panel app-chat">
          {/* Message feed */}
          <div className="chat-feed" ref={chatRef}>
            {messages.map(msg => (
              <div key={msg.id} className={`chat-row-full anim-msg ${msg.from}`}>
                <div className="chat-avatar" style={{ background: msg.from === 'bot' ? 'var(--color-primary-light)' : 'var(--color-bg-soft)' }}>
                  {msg.from === 'bot' ? <BotIcon /> : <UserAvatarIcon />}
                </div>
                <div>
                  <div className="chat-bubble-full">
                    {msg.analysis ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 10px', borderRadius: 99, display: 'inline-block' }}>
                          {msg.analysis.intent}
                        </span>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-heading)' }}>{msg.analysis.directAnswer}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{msg.analysis.explanation}</div>
                        <div style={{ padding: '10px 14px', background: 'var(--color-success-light)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--color-success)', whiteSpace: 'pre-line' }}>
                          {msg.analysis.recommendation}
                        </div>
                      </div>
                    ) : msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, padding: '0 4px' }}>{msg.time}</div>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="chat-row-full bot">
                <div className="chat-avatar" style={{ background: 'var(--color-primary-light)' }}><BotIcon /></div>
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
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', flexShrink: 0 }}>Ask:</span>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="sug-btn" onClick={() => sendMessage(s.q)}>{s.label.split(' ')[1]}</button>
            ))}
          </div>

          {/* Input bar */}
          <div className="chat-input-bar">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask a weather decision question..."
              disabled={thinking}
            />
            <button className="chat-send-btn" onClick={() => sendMessage(input)} disabled={!input.trim() || thinking}>
              Analyze →
            </button>
          </div>
        </div>

        {/* Audit Panel */}
        <div className="app-panel app-insights" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          <div>
            <div className="panel-title">Decision Audit</div>
            <div className="panel-desc">Threshold check results from last query.</div>
          </div>
          {lastAnalysis ? (
            <>
              <div style={{ padding: '10px 14px', background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 4 }}>Intent</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text-heading)' }}>{lastAnalysis.intent}</div>
              </div>
              <div className="safety-bar-row">
                <div className="safety-bar-label-row">
                  <span>Safety Index</span>
                  <span style={{ color: lastAnalysis.safetyScore >= 75 ? 'var(--color-success)' : lastAnalysis.safetyScore >= 40 ? 'var(--color-warning)' : 'var(--color-danger)', fontWeight: 800 }}>{lastAnalysis.safetyScore}%</span>
                </div>
                <div className="safety-bar-track">
                  <div className={`safety-bar-fill ${lastAnalysis.safetyScore >= 75 ? 'safety-high' : lastAnalysis.safetyScore >= 40 ? 'safety-mid' : 'safety-low'}`} style={{ width: `${lastAnalysis.safetyScore}%` }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>Parameter Checks</div>
                {lastAnalysis.checklist.map((c, i) => (
                  <div key={i} className="checklist-item">
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{c.label}</span>
                    <span className={`pass-badge ${c.pass ? 'pass' : 'fail'}`}>{c.value} {c.pass ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ fontWeight: 600 }}>No query yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Send a question to see the audit trail.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── LANDING PAGE ─────────────────────────────────────────────────────────────
  return (
    <div className="page-wrap">

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
            <button className="btn btn-primary btn-sm" onClick={() => setLaunched(true)}>
              Launch Copilot →
            </button>
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
                WeatherAI Copilot translates atmospheric data into clear, actionable advice. Plan planting cycles, beach trips, fitness sessions, and home maintenance with total confidence.
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
                    <div>Planting maize during this period is favorable.</div>
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
              { icon: '🌾', title: 'Farming & Agriculture', color: '#d1fae5', iconColor: '#16a34a', desc: 'Determine optimal planting times based on moisture trends, and check wind-safety limits before spraying crops.' },
              { icon: '🏖️', title: 'Travel & Leisure',      color: '#fef3c7', iconColor: '#d97706', desc: 'Validate beach conditions, flag high UV index days, and assess visibility for road trips and outdoor holidays.' },
              { icon: '🏃', title: 'Sports & Training',     color: '#dbeafe', iconColor: '#2563eb', desc: 'Check temperature ranges, precipitation hazards, and wind to keep your running, hiking, and sports sessions safe.' },
              { icon: '🏠', title: 'Home & Maintenance',    color: '#f3e8ff', iconColor: '#7c3aed', desc: 'Verify moisture thresholds before painting walls, check drying windows for laundry, and plan outdoor projects.' },
            ].map(f => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon-wrap" style={{ background: f.color }}>
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
          <div style={{ marginBottom: 48 }}>
            <span className="section-label">Interactive Teaser</span>
            <h2 className="section-title">Tweak the Sandbox. Witness the Decision.</h2>
            <p className="section-desc">Slide the controls to adjust simulated weather conditions and watch the AI recommendation update instantly.</p>
          </div>
          <div className="sandbox-grid">
            {/* Controls */}
            <div className="sandbox-panel">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 10 }}>1. Select Your Query</div>
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
              <div className="safety-bar-row">
                <div className="safety-bar-label-row">
                  <span>Safety Index</span>
                  <span style={{ color: sandboxResult.safetyScore >= 75 ? 'var(--color-success)' : sandboxResult.safetyScore >= 40 ? 'var(--color-warning)' : 'var(--color-danger)', fontWeight: 800 }}>
                    {sandboxResult.safetyScore}%
                  </span>
                </div>
                <div className="safety-bar-track">
                  <div className={`safety-bar-fill ${sandboxResult.safetyScore >= 75 ? 'safety-high' : sandboxResult.safetyScore >= 40 ? 'safety-mid' : 'safety-low'}`} style={{ width: `${sandboxResult.safetyScore}%` }} />
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
