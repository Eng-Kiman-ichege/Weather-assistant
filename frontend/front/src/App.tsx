import { useState, useEffect, useRef } from 'react';
import './App.css';

// ============================================================================
// Types
// ============================================================================
interface WeatherData {
  temperature: number;
  rainProbability: number;
  windSpeed: number;
  uvIndex: number;
  forecast: string;
  location: string;
}

interface ChecklistItem {
  label: string;
  pass: boolean;
  value: string;
}

interface AnalysisResult {
  intent: string;
  safetyScore: number;
  checklist: ChecklistItem[];
  directAnswer: string;
  explanation: string;
  recommendation: string;
}

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  analysis?: AnalysisResult;
}

// ============================================================================
// Animated Custom SVG Icons
// ============================================================================

const SunIcon = () => (
  <svg className="w-10 h-10 text-amber-500 animate-sun-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const CloudIcon = () => (
  <svg className="w-10 h-10 text-slate-400 animate-cloud" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.3.27A7 7 0 1 0 3 15.5c0 1.93 1.57 3.5 3.5 3.5h11z" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

const PartlyCloudyIcon = () => (
  <svg className="w-10 h-10 animate-cloud" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Sun */}
    <path className="text-amber-500 animate-sun-spin" d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M6.34 17.66l-1.41 1.41" strokeLinecap="round" />
    <circle className="text-amber-500 animate-sun-spin" cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
    {/* Cloud */}
    <path className="text-slate-400" d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.3.27A7 7 0 1 0 3 15.5c0 1.93 1.57 3.5 3.5 3.5h11z" fill="currentColor" fillOpacity="0.8" />
  </svg>
);

const RainIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path className="text-slate-400 animate-cloud" d="M17 16.5a4 4 0 0 0 0-8h-.7a7 7 0 1 0-12 5.5" fill="currentColor" fillOpacity="0.1" />
    {/* Rain drops */}
    <path className="text-blue-500 animate-rain-drop-1" d="M8 18v2" />
    <path className="text-blue-500 animate-rain-drop-2" d="M12 18v2" />
    <path className="text-blue-500 animate-rain-drop-3" d="M16 18v2" />
  </svg>
);

const ThunderIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path className="text-slate-500 animate-cloud" d="M17 16.5a4 4 0 0 0 0-8h-.7a7 7 0 1 0-12 5.5" fill="currentColor" fillOpacity="0.15" />
    {/* Lightning */}
    <path className="text-yellow-400 fill-yellow-400" d="M13 14h-3l2-5h-3l4-5-1 5h3z" />
    {/* Rain drops */}
    <path className="text-blue-600 animate-rain-drop-1" d="M8 19v2" />
    <path className="text-blue-600 animate-rain-drop-3" d="M14 19v2" />
  </svg>
);

const WindIcon = () => (
  <svg className="w-10 h-10 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Turbine Stand */}
    <path d="M12 12v10M9 22h6" strokeWidth="2" />
    {/* Spinning Turbine Blades */}
    <g className="animate-windmill">
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 12V4c0.5 0 2 1.5 2 3s-1.5 5-2 5z" fill="currentColor" fillOpacity="0.3" />
      <path d="M12 12h8c0 0.5-1.5 2-3 2s-5-1.5-5-2z" fill="currentColor" fillOpacity="0.3" />
      <path d="M12 12L6.34 6.34c0.35-.35 2.12-.5 3.18.56s.48 5.1-.02 5.1z" fill="currentColor" fillOpacity="0.3" />
    </g>
  </svg>
);

const SnowIcon = () => (
  <svg className="w-10 h-10 text-sky-300 animate-cloud" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
    <path className="animate-rain-drop-2" d="M8 16h.01M12 16h.01M16 16h.01M10 19h.01M14 19h.01" strokeWidth="3" />
  </svg>
);

const CopilotIcon = () => (
  <svg className="w-8 h-8 text-indigo-500 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2" fill="currentColor" fillOpacity="0.1" />
    <circle cx="8" cy="16" r="1.5" fill="currentColor" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    <path d="M9 19c1.5 1 4.5 1 6 0" strokeLinecap="round" />
    <path d="M12 2v3M9 5h6M12 11V8" strokeLinecap="round" />
    <path d="M2 13h1M21 13h1" strokeLinecap="round" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-8 h-8 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

// Helper to render appropriate weather icon based on status string
const renderWeatherIcon = (forecast: string) => {
  switch (forecast) {
    case 'Sunny': return <SunIcon />;
    case 'Partly Cloudy': return <PartlyCloudyIcon />;
    case 'Overcast': return <CloudIcon />;
    case 'Showers': return <RainIcon />;
    case 'Thunderstorm': return <ThunderIcon />;
    case 'Windy': return <WindIcon />;
    case 'Chilly/Snowy': return <SnowIcon />;
    default: return <SunIcon />;
  }
};

// ============================================================================
// Presets configuration
// ============================================================================
const LOCATION_PRESETS: WeatherData[] = [
  {
    location: 'Nairobi (Farming Highlands)',
    temperature: 21,
    rainProbability: 75,
    windSpeed: 12,
    uvIndex: 6,
    forecast: 'Showers'
  },
  {
    location: 'Miami (Coastal Beach)',
    temperature: 31,
    rainProbability: 10,
    windSpeed: 14,
    uvIndex: 10,
    forecast: 'Sunny'
  },
  {
    location: 'Cape Town (Windy Ridge)',
    temperature: 17,
    rainProbability: 25,
    windSpeed: 48,
    uvIndex: 4,
    forecast: 'Windy'
  },
  {
    location: 'London (Chilly Storm)',
    temperature: 8,
    rainProbability: 85,
    windSpeed: 25,
    uvIndex: 1,
    forecast: 'Thunderstorm'
  }
];

// Suggested questions
const QUICK_SUGGESTIONS = [
  { label: '🌾 Maize Planting', query: 'Can I plant maize this weekend?' },
  { label: '🏖️ Beach Holiday', query: 'Should I go to the beach this weekend?' },
  { label: '🏃 Outdoor Sports', query: 'Is it a good day to run outdoors?' },
  { label: '🎨 Fence Painting', query: 'Can I paint my garden fence today?' },
  { label: '🚜 Crop Spraying', query: 'Is it safe to spray pesticides on my crops today?' },
  { label: '🚗 Car Washing', query: 'Should I wash my car today?' }
];

// ============================================================================
// WeatherAI Core Decision Engine (Client Side Simulator)
// ============================================================================
function analyzeWeatherQuery(query: string, weather: WeatherData): AnalysisResult {
  const q = query.toLowerCase();
  let intent = 'General Planning';
  let directAnswer = '';
  let explanation = '';
  let recommendation = '';
  let safetyScore = 100;
  let checklist: ChecklistItem[] = [];

  // 1. Agriculture / Crop Spraying / Pesticides
  if (q.includes('plant') || q.includes('maize') || q.includes('crop') || q.includes('farm') || q.includes('seed') || q.includes('fertilizer') || q.includes('spray') || q.includes('pesticide') || q.includes('harvest')) {
    intent = 'Agriculture & Farming';
    const isSpraying = q.includes('spray') || q.includes('pesticide') || q.includes('fertilizer');
    
    if (isSpraying) {
      const windOk = weather.windSpeed <= 20;
      const rainOk = weather.rainProbability <= 25;
      const tempOk = weather.temperature >= 10 && weather.temperature <= 32;
      
      checklist = [
        { label: 'Wind Speed (Max 20 km/h)', pass: windOk, value: `${weather.windSpeed} km/h` },
        { label: 'Rain Prob (Max 25%)', pass: rainOk, value: `${weather.rainProbability}%` },
        { label: 'Temp Range (10°C - 32°C)', pass: tempOk, value: `${weather.temperature}°C` }
      ];
      
      safetyScore = (windOk ? 40 : 0) + (rainOk ? 40 : 0) + (tempOk ? 20 : 0);
      
      if (windOk && rainOk && tempOk) {
        directAnswer = 'Conditions are safe to apply crop sprays.';
        explanation = `Low wind speeds of ${weather.windSpeed} km/h minimize spray drift, and minimal rain risk ensures treatment won't wash off.`;
        recommendation = 'Recommended spraying time: Saturday morning. Proceed with application.';
      } else {
        directAnswer = 'Postpone crop spraying activities.';
        const reasons: string[] = [];
        if (!windOk) reasons.push(`high winds (${weather.windSpeed} km/h) causing drift`);
        if (!rainOk) reasons.push(`high rain probability (${weather.rainProbability}%) washing chemicals off`);
        if (!tempOk) reasons.push(`unfavorable temperature (${weather.temperature}°C)`);
        
        explanation = `Spraying is risky right now due to ${reasons.join(' and ')}.`;
        recommendation = 'Recommendation: Wait for calmer, drier conditions (Wind < 20 km/h, Rain < 25%).';
      }
    } else {
      // General planting
      const rainOk = weather.rainProbability >= 30 && weather.rainProbability <= 80;
      const stormRisk = weather.forecast === 'Thunderstorm' || weather.rainProbability > 85;
      const tempOk = weather.temperature >= 15 && weather.temperature <= 32;
      
      checklist = [
        { label: 'Soil Moisture / Rain (30% - 80%)', pass: rainOk && !stormRisk, value: `${weather.rainProbability}%` },
        { label: 'Severe Weather Risk (No Storms)', pass: !stormRisk, value: weather.forecast },
        { label: 'Germination Temp (15°C - 32°C)', pass: tempOk, value: `${weather.temperature}°C` }
      ];
      
      safetyScore = (rainOk && !stormRisk ? 40 : 15) + (!stormRisk ? 40 : 0) + (tempOk ? 20 : 0);
      
      if (!tempOk) {
        directAnswer = 'Temperatures are unfavorable for planting.';
        explanation = weather.temperature < 15 
          ? `The temperature is too chilly (${weather.temperature}°C) for seed germination.` 
          : `Extreme heat (${weather.temperature}°C) will stress young sprouts.`;
        recommendation = 'Recommendation: Hold off planting until temperatures stabilize between 15°C and 32°C.';
      } else if (stormRisk) {
        directAnswer = 'Do not plant seeds this weekend.';
        explanation = `Heavy storms (${weather.forecast}) or high rainfall risks washing away seeds and eroding topsoil.`;
        recommendation = 'Recommendation: Wait for severe weather alerts to clear before seeding.';
      } else if (rainOk) {
        directAnswer = 'Rain is expected over the weekend, providing good soil moisture.';
        explanation = `Planting maize during this period is favorable.`;
        recommendation = 'Recommended planting time:\nSaturday morning.';
      } else {
        // Dry conditions
        directAnswer = 'Planting is possible, but supplemental watering is required.';
        explanation = `Low rain probability (${weather.rainProbability}%) means dry soil conditions, which may delay germination.`;
        recommendation = 'Recommendation: Irrigate immediately after sowing if planting today.';
      }
    }
  } 
  // 2. Beach / Swimming
  else if (q.includes('beach') || q.includes('pool') || q.includes('swim') || q.includes('sunbathe')) {
    intent = 'Travel & Leisure';
    const tempOk = weather.temperature >= 23;
    const rainOk = weather.rainProbability <= 30;
    const forecastOk = ['Sunny', 'Partly Cloudy'].includes(weather.forecast);
    const uvHigh = weather.uvIndex >= 7;
    
    checklist = [
      { label: 'Warm Temp (Min 23°C)', pass: tempOk, value: `${weather.temperature}°C` },
      { label: 'Dry Weather (Max 30% Rain)', pass: rainOk, value: `${weather.rainProbability}%` },
      { label: 'Sky Conditions (Sunny/Clear)', pass: forecastOk, value: weather.forecast }
    ];
    
    safetyScore = (tempOk ? 45 : 10) + (rainOk ? 45 : 0) + (forecastOk ? 10 : 0);
    
    if (tempOk && rainOk && forecastOk) {
      directAnswer = 'Sunny conditions with low rainfall are expected.';
      explanation = `This is a great time for beach activities.`;
      recommendation = uvHigh 
        ? `Recommendation:\nIdeal for travel and outdoor plans. Apply sunscreen (UV index: ${weather.uvIndex}).`
        : 'Recommendation:\nIdeal for travel and outdoor plans.';
    } else {
      directAnswer = 'Conditions are unfavorable for the beach.';
      const factors: string[] = [];
      if (!tempOk) factors.push(`chilly temperatures (${weather.temperature}°C)`);
      if (!rainOk) factors.push(`high chance of rainfall (${weather.rainProbability}%)`);
      if (!forecastOk) fillOutGloomyForecast(weather.forecast, factors);
      
      explanation = `Beach plans are impacted by ${factors.join(', and ')}.`;
      recommendation = 'Recommendation: Consider indoor recreation or reschedule to a warmer day.';
    }
  } 
  // 3. Running / Sports / Hiking
  else if (q.includes('run') || q.includes('sport') || q.includes('hike') || q.includes('hiking') || q.includes('marathon') || q.includes('football') || q.includes('soccer') || q.includes('tennis')) {
    intent = 'Sports & Outdoor Activities';
    const tempOk = weather.temperature >= 8 && weather.temperature <= 28;
    const rainOk = weather.rainProbability <= 50;
    const windOk = weather.windSpeed <= 35;
    
    checklist = [
      { label: 'Comfortable Temp (8°C - 28°C)', pass: tempOk, value: `${weather.temperature}°C` },
      { label: 'Low Rain Hazard (Max 50%)', pass: rainOk, value: `${weather.rainProbability}%` },
      { label: 'Safe Wind Speeds (Max 35 km/h)', pass: windOk, value: `${weather.windSpeed} km/h` }
    ];
    
    safetyScore = (tempOk ? 40 : 10) + (rainOk ? 40 : 10) + (windOk ? 20 : 0);
    
    if (tempOk && rainOk && windOk) {
      directAnswer = 'Weather conditions are ideal for outdoor training.';
      explanation = `Moderate temperatures of ${weather.temperature}°C and low rain risk are pleasant for cardio.`;
      recommendation = 'Recommendation: Favorable for running. Morning or evening slots are best.';
    } else {
      directAnswer = 'Outdoor activity is not advised.';
      const hazards: string[] = [];
      if (!tempOk) hazards.push(weather.temperature < 8 ? 'extreme cold' : 'excessive heat stroke risk');
      if (!rainOk) hazards.push('slippery conditions due to rain');
      if (!windOk) hazards.push('heavy winds making breathing/movement difficult');
      
      explanation = `Outdoor sports are compromised due to ${hazards.join(', and ')}.`;
      recommendation = 'Recommendation: Opt for an indoor gym workout or treadmill session.';
    }
  } 
  // 4. Painting / Laundry / Daily Maintenance
  else if (q.includes('paint') || q.includes('fence') || q.includes('wash') || q.includes('laundry') || q.includes('dry')) {
    intent = 'Home & Daily Errands';
    const rainOk = weather.rainProbability <= 20;
    const tempOk = weather.temperature >= 12 && weather.temperature <= 35;
    const isPainting = q.includes('paint') || q.includes('fence');
    
    checklist = [
      { label: 'Dry Weather (Max 20% Rain)', pass: rainOk, value: `${weather.rainProbability}%` },
      { label: 'Ideal Temp (12°C - 35°C)', pass: tempOk, value: `${weather.temperature}°C` }
    ];
    
    safetyScore = (rainOk ? 60 : 0) + (tempOk ? 40 : 10);
    
    if (isPainting) {
      if (rainOk && tempOk) {
        directAnswer = 'Favorable weather conditions for outdoor painting projects.';
        explanation = `The warm temperature (${weather.temperature}°C) and zero rain risk allow the paint coat to cure evenly.`;
        recommendation = 'Recommendation: Start painting by 9:00 AM to allow full daytime drying.';
      } else {
        directAnswer = 'Do not paint outdoors today.';
        explanation = `Damp weather (${weather.rainProbability}% rain probability) or cold temperature will ruin paint adhesion.`;
        recommendation = 'Recommendation: Reschedule painting tasks for a clear, dry day.';
      }
    } else {
      if (rainOk) {
        directAnswer = 'Excellent day to hang laundry or wash vehicles.';
        explanation = `Low precipitation risk (${weather.rainProbability}%) and dry air will dry fabrics quickly.`;
        recommendation = 'Recommendation: Hang laundry early. Favorable drying window: All day.';
      } else {
        directAnswer = 'Postpone washing cars or hanging laundry outside.';
        explanation = `Rain risk of ${weather.rainProbability}% means fabrics will remain damp and car finishes will get spotted.`;
        recommendation = 'Recommendation: Use indoor drying racks or wait for a dry weather gap.';
      }
    }
  } 
  // 5. Travel / Road Trips
  else if (q.includes('travel') || q.includes('trip') || q.includes('drive') || q.includes('road')) {
    intent = 'Travel & Tourism';
    const severeRisk = weather.forecast === 'Thunderstorm' || weather.windSpeed >= 50 || weather.rainProbability >= 85;
    
    checklist = [
      { label: 'No Thunderstorms', pass: weather.forecast !== 'Thunderstorm', value: weather.forecast },
      { label: 'Safe Wind Speeds (Max 50 km/h)', pass: weather.windSpeed < 50, value: `${weather.windSpeed} km/h` },
      { label: 'Good Visibility (Rain < 85%)', pass: weather.rainProbability < 85, value: `${weather.rainProbability}%` }
    ];
    
    safetyScore = severeRisk ? 30 : 95;
    
    if (!severeRisk) {
      directAnswer = 'Travel and driving conditions are normal.';
      explanation = `No severe weather alerts are active. Roads should be clear and visibility normal.`;
      recommendation = 'Recommendation: Safe for road trips. Practice defensive driving.';
    } else {
      directAnswer = 'Exercise high caution or reschedule travel.';
      explanation = `Unstable conditions including ${weather.forecast === 'Thunderstorm' ? 'severe thunderstorms' : weather.windSpeed >= 50 ? 'gale force winds' : 'heavy rainfall and low visibility'} pose traffic hazards.`;
      recommendation = 'Recommendation: Reschedule long commutes until storms pass.';
    }
  } 
  // 6. General
  else {
    intent = 'Daily Planning';
    const pleasant = weather.temperature >= 18 && weather.temperature <= 26 && weather.rainProbability < 40 && weather.windSpeed < 30;
    
    checklist = [
      { label: 'Mild Temp (18°C - 26°C)', pass: weather.temperature >= 18 && weather.temperature <= 26, value: `${weather.temperature}°C` },
      { label: 'Low Rain Chance (< 40%)', pass: weather.rainProbability < 40, value: `${weather.rainProbability}%` },
      { label: 'Gentle Winds (< 30 km/h)', pass: weather.windSpeed < 30, value: `${weather.windSpeed} km/h` }
    ];
    
    safetyScore = pleasant ? 90 : 60;
    
    if (pleasant) {
      directAnswer = 'The weather is very pleasant for outdoor plans today.';
      explanation = `The temperature is comfortable (${weather.temperature}°C) with low rain risk.`;
      recommendation = 'Recommendation: Ideal for outdoor runs, errands, and walks.';
    } else {
      directAnswer = 'Weather conditions are unstable today.';
      explanation = `Current metrics show ${weather.temperature < 15 ? 'chilly weather' : weather.temperature > 30 ? 'high heat' : ''} ${weather.rainProbability >= 50 ? 'with high rain chance' : ''} ${weather.windSpeed >= 30 ? 'with strong winds' : ''}.`;
      recommendation = 'Recommendation: Plan indoor activities or carry appropriate weather gear.';
    }
  }

  return {
    intent,
    safetyScore,
    checklist,
    directAnswer,
    explanation,
    recommendation
  };
}

function fillOutGloomyForecast(forecast: string, factors: string[]) {
  factors.push(`gloomy sky conditions (${forecast})`);
}

// ============================================================================
// Main Application Component
// ============================================================================
export default function App() {
  // Current simulated weather state
  const [weather, setWeather] = useState<WeatherData>({
    location: 'Nairobi (Farming Highlands)',
    temperature: 21,
    rainProbability: 75,
    windSpeed: 12,
    uvIndex: 6,
    forecast: 'Showers'
  });

  // Chat message feed state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: "Hello! I am WeatherAI Copilot, your intelligent decision assistant. Select a location preset or use the simulator panel to set weather conditions, then ask me anything about farming, beach plans, sports, painting, laundry, or travel. I will provide a clear weather-based recommendation.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Current query input
  const [inputVal, setInputVal] = useState('');
  
  // Is "AI" analyzing the query
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Keep track of active preset location
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);

  // Keep track of the last query analysis to display in the right sidebar
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);

  // Mobile sidebar states
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  // Chat scroll anchor
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  // Handle preset clicks
  const selectPresetLocation = (index: number) => {
    setActivePresetIndex(index);
    const preset = LOCATION_PRESETS[index];
    setWeather(preset);
  };

  // Synchronize manual adjustments with presets indicator (deselect if customized)
  const handleSimAdjustment = <K extends keyof WeatherData>(key: K, value: WeatherData[K]) => {
    setWeather(prev => {
      const next = { ...prev, [key]: value };
      // Check if this matches any preset exactly, otherwise set index to -1 (custom)
      const matchingPresetIndex = LOCATION_PRESETS.findIndex(preset => 
        preset.temperature === (key === 'temperature' ? value : preset.temperature) &&
        preset.rainProbability === (key === 'rainProbability' ? value : preset.rainProbability) &&
        preset.windSpeed === (key === 'windSpeed' ? value : preset.windSpeed) &&
        preset.uvIndex === (key === 'uvIndex' ? value : preset.uvIndex) &&
        preset.forecast === (key === 'forecast' ? value : preset.forecast)
      );
      setActivePresetIndex(matchingPresetIndex);
      return next;
    });
  };

  // Submit a query
  const handleQuerySubmit = (queryText: string) => {
    if (!queryText.trim()) return;

    // Add user message
    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputVal('');
    setIsAnalyzing(true);

    // Mock processing delay to simulate real-time AI modeling
    setTimeout(() => {
      const analysis = analyzeWeatherQuery(queryText, weather);
      const responseText = `${analysis.directAnswer}\n\n${analysis.explanation}\n\n${analysis.recommendation}`;
      
      const copilotMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'copilot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        analysis: analysis
      };

      setMessages(prev => [...prev, copilotMsg]);
      setLastAnalysis(analysis);
      setIsAnalyzing(false);
      
      // Auto-open analysis panel on larger displays, or alert for mobile
      if (window.innerWidth < 1200) {
        setIsInsightsOpen(true);
      }
    }, 900);
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#070913]">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <CopilotIcon />
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-heading text-indigo-600 dark:text-indigo-400 m-0 tracking-tight leading-none">
              WeatherAI Copilot
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans hidden sm:block">
              Intelligent decision support based on micro-climates
            </p>
          </div>
        </div>

        {/* Action Preset Buttons (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Presets:</span>
          {LOCATION_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => selectPresetLocation(index)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
                activePresetIndex === index
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {preset.location.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Mobile controls toggles */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => { setIsSimOpen(!isSimOpen); setIsInsightsOpen(false); }}
            className={`p-2 rounded-lg border text-xs font-medium transition-all ${
              isSimOpen 
                ? 'bg-indigo-600 border-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            ☀️ Simulator
          </button>
          <button
            onClick={() => { setIsInsightsOpen(!isInsightsOpen); setIsSimOpen(false); }}
            className={`p-2 rounded-lg border text-xs font-medium transition-all ${
              isInsightsOpen 
                ? 'bg-indigo-600 border-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
            disabled={!lastAnalysis}
          >
            📊 Analysis {lastAnalysis ? '⚡' : ''}
          </button>
        </div>
      </header>

      {/* Main Responsive Grid Dashboard */}
      <main className="dashboard-layout">
        
        {/* =================================================================== */}
        {/* LEFT COLUMN: Interactive Weather Simulator                         */}
        {/* =================================================================== */}
        <aside className={`glass-panel p-5 flex flex-col gap-6 ${
          isSimOpen ? 'block fixed inset-x-4 top-20 bottom-4 z-40 bg-white dark:bg-slate-900 overflow-y-auto' : 'hidden md:flex'
        }`}>
          <div>
            <h2 className="text-lg font-bold flex items-center justify-between text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>Weather Simulator</span>
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-semibold">
                {activePresetIndex >= 0 ? 'Preset' : 'Manual'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Manually slide parameters to test how WeatherAI changes recommendation thresholds dynamically.
            </p>
          </div>

          {/* Active Preset Info Display */}
          <div className="flex items-center gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-4 rounded-xl">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
              {renderWeatherIcon(weather.forecast)}
            </div>
            <div className="flex-grow min-w-0">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Simulated Climate</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate block">{weather.location}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{weather.forecast} Sky</span>
            </div>
          </div>

          {/* Simulation Sliders */}
          <div className="flex flex-col gap-5">
            {/* Forecast Select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Forecast Sky State</label>
              <select
                value={weather.forecast}
                onChange={(e) => handleSimAdjustment('forecast', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg glass-input cursor-pointer"
              >
                <option value="Sunny">☀️ Sunny / Clear</option>
                <option value="Partly Cloudy">⛅ Partly Cloudy</option>
                <option value="Overcast">☁️ Overcast / Gloomy</option>
                <option value="Showers">🌧️ Showers / Light Rain</option>
                <option value="Thunderstorm">⛈️ Thunderstorm / Heavy Rain</option>
                <option value="Windy">💨 Windy / Gales</option>
                <option value="Chilly/Snowy">❄️ Chilly / Snowy</option>
              </select>
            </div>

            {/* Temperature Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Temperature</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{weather.temperature}°C</span>
              </div>
              <input
                type="range"
                min="-10"
                max="45"
                value={weather.temperature}
                onChange={(e) => {
                  handleSimAdjustment('temperature', parseInt(e.target.value));
                  handleSimAdjustment('location', 'Custom Location (Modified)');
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Freezing (-10°C)</span>
                <span>Scorch (45°C)</span>
              </div>
            </div>

            {/* Rain Probability Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rain Probability</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{weather.rainProbability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weather.rainProbability}
                onChange={(e) => {
                  handleSimAdjustment('rainProbability', parseInt(e.target.value));
                  handleSimAdjustment('location', 'Custom Location (Modified)');
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Arid (0%)</span>
                <span>Deluge (100%)</span>
              </div>
            </div>

            {/* Wind Speed Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Wind Speed</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{weather.windSpeed} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={weather.windSpeed}
                onChange={(e) => {
                  handleSimAdjustment('windSpeed', parseInt(e.target.value));
                  handleSimAdjustment('location', 'Custom Location (Modified)');
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Calm (0 km/h)</span>
                <span>Gale (80 km/h)</span>
              </div>
            </div>

            {/* UV Index Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">UV Index</span>
                <span className={`text-sm font-bold ${
                  weather.uvIndex >= 8 ? 'text-red-500 dark:text-red-400 animate-uv-glow' : 'text-indigo-600 dark:text-indigo-400'
                }`}>{weather.uvIndex}</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={weather.uvIndex}
                onChange={(e) => {
                  handleSimAdjustment('uvIndex', parseInt(e.target.value));
                  handleSimAdjustment('location', 'Custom Location (Modified)');
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Low (0)</span>
                <span>Extreme (12)</span>
              </div>
            </div>
          </div>

          {/* Quick preset changer (Mobile Inside Simulator Drawer) */}
          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 lg:hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Preset Templates</span>
            <div className="grid grid-cols-2 gap-2">
              {LOCATION_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => {
                    selectPresetLocation(index);
                    setIsSimOpen(false);
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                    activePresetIndex === index
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border-transparent text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {preset.location.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* =================================================================== */}
        {/* CENTER COLUMN: WeatherAI Assistant Chat Feed                       */}
        {/* =================================================================== */}
        <section className="flex flex-col glass-panel min-h-[500px] h-[calc(100vh-120px)] overflow-hidden">
          
          {/* Chat Feed Window */}
          <div className="flex-grow overflow-y-auto p-4 md:p-6 flex flex-col gap-6 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] chat-message-entry ${
                  msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                {/* Avatar Icon */}
                <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full border shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    : 'bg-indigo-50 dark:bg-indigo-950 border-indigo-100 dark:border-indigo-900/50'
                }`}>
                  {msg.sender === 'user' ? <UserIcon /> : <CopilotIcon />}
                </div>

                {/* Message Bubble Wrapper */}
                <div className="flex flex-col gap-1.5">
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-800 rounded-tl-none shadow-sm'
                  }`}>
                    
                    {/* Render Formatted Text (Direct Answer, Explanation, Recommendation) */}
                    {msg.sender === 'copilot' ? (
                      <div className="space-y-3 whitespace-pre-line">
                        {/* If analysis metadata is attached, let's render it cleanly */}
                        {msg.analysis ? (
                          <>
                            {/* Intent Badge */}
                            <span className="inline-block text-[10px] uppercase tracking-wider font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full mb-1">
                              {msg.analysis.intent}
                            </span>
                            
                            {/* Direct Answer */}
                            <div className="font-semibold text-slate-900 dark:text-white text-base">
                              {msg.analysis.directAnswer}
                            </div>
                            
                            {/* Explanation */}
                            <div className="text-slate-600 dark:text-slate-300">
                              {msg.analysis.explanation}
                            </div>
                            
                            {/* Recommendation Highlight Box */}
                            <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-xl font-medium text-xs leading-normal">
                              {msg.analysis.recommendation}
                            </div>
                          </>
                        ) : (
                          // Fallback welcome message
                          <div>{msg.text}</div>
                        )}
                      </div>
                    ) : (
                      <div className="font-medium">{msg.text}</div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <span className={`text-[10px] text-slate-400 px-1 ${
                    msg.sender === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Simulated Loading/Analyzing State */}
            {isAnalyzing && (
              <div className="flex gap-3 self-start max-w-[80%] chat-message-entry">
                <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                  <CopilotIcon />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="px-4 py-3.5 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-xs text-slate-400 font-sans ml-1">Analyzing simulated atmospheric values...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Suggested Prompts row */}
          <div className="px-4 md:px-6 py-2 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-900 overflow-x-auto flex items-center gap-2 no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-1">Ask:</span>
            {QUICK_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleQuerySubmit(sug.query)}
                className="shrink-0 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all shadow-sm font-sans"
              >
                {sug.label}
              </button>
            ))}
          </div>

          {/* Form Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuerySubmit(inputVal);
            }}
            className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask a decision question (e.g. Can I plant crops today?)"
              className="flex-grow px-4 py-3 text-sm rounded-xl glass-input outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isAnalyzing}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 shrink-0"
            >
              <span>Analyze</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </section>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: Intent Analyst & Thresholds Metrics Dashboard        */}
        {/* =================================================================== */}
        <aside className={`insights-panel glass-panel p-5 flex flex-col gap-6 ${
          isInsightsOpen ? 'block fixed inset-x-4 top-20 bottom-4 z-40 bg-white dark:bg-slate-900 overflow-y-auto' : 'hidden xl:flex'
        }`}>
          <div>
            <h2 className="text-lg font-bold flex items-center justify-between text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>Decision Analyst</span>
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-500 px-2 py-0.5 rounded-full font-bold animate-pulse">
                Live Insights
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Real-time audit log of safety limits, moisture indices, and intent matching rules.
            </p>
          </div>

          {lastAnalysis ? (
            <div className="flex flex-col gap-5">
              {/* Intent classification summary */}
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Matched Intent Category</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1 block">
                  {lastAnalysis.intent}
                </span>
              </div>

              {/* Safety Score Meter */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>SAFETY INDEX</span>
                  <span className={`font-mono text-sm font-extrabold ${
                    lastAnalysis.safetyScore >= 75 ? 'text-emerald-500' : lastAnalysis.safetyScore >= 40 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {lastAnalysis.safetyScore} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      lastAnalysis.safetyScore >= 75 ? 'bg-emerald-500' : lastAnalysis.safetyScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${lastAnalysis.safetyScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 italic">
                  {lastAnalysis.safetyScore >= 75 
                    ? '✓ Environment satisfies all threshold criteria.' 
                    : lastAnalysis.safetyScore >= 40 
                      ? '⚠ Moderate risk constraints flagged in weather profile.' 
                      : '✗ Warning: Crucial weather safety criteria failed.'
                  }
                </span>
              </div>

              {/* Metrics Evaluated checklist */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Checked Threshold Parameters</span>
                <div className="flex flex-col gap-2">
                  {lastAnalysis.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-100/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {item.pass ? (
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                            ✓
                          </span>
                        ) : (
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-[10px]">
                            ✕
                          </span>
                        )}
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                      </div>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <svg className="w-12 h-12 text-slate-300 dark:text-slate-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              </svg>
              <div className="px-4">
                <span className="text-sm font-bold text-slate-500 block mb-1">No Query Analyzed Yet</span>
                <span className="text-xs text-slate-400">
                  Ask a question in the chat room to display the AI safety checklist audit trail.
                </span>
              </div>
            </div>
          )}

          {/* Close Panel Button (Mobile Drawer) */}
          <button
            onClick={() => setIsInsightsOpen(false)}
            className="w-full mt-auto py-2.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 lg:hidden hover:bg-slate-200"
          >
            Close Analyst View
          </button>
        </aside>
      </main>
    </div>
  );
}
