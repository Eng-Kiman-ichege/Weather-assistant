export interface WeatherSummary {
  location: string;
  temperature: number;
  rainProbability: number;
  windSpeed: number;
  uvIndex: number;
  forecast: string;
  latitude?: number;
  longitude?: number;
}

const DEFAULT_REMOTE_BACKEND = 'https://weather-assistant-t0ds.onrender.com';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.trim() || DEFAULT_REMOTE_BACKEND;
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY?.trim() || '';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY?.trim() || '';

async function apiFetch(path: string, options?: RequestInit) {
  const url = BACKEND_URL ? `${BACKEND_URL}${path}` : path;
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend request failed (${response.status}): ${errorText}`);
  }
  return response.json();
}

async function geocodeLocation(location: string): Promise<{ latitude: number; longitude: number; name: string; }> {
  const encodedLocation = encodeURIComponent(location);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedLocation}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }
  const data = await response.json();
  const result = data.results?.[0];
  if (!result) {
    throw new Error('Unable to resolve location.');
  }
  return {
    latitude: Number(result.latitude ?? 0),
    longitude: Number(result.longitude ?? 0),
    name: result.name || location,
  };
}

async function fetchOpenMeteoWeather(location: string): Promise<WeatherSummary> {
  const geo = await geocodeLocation(location);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true&hourly=precipitation_probability,windspeed_10m,uv_index&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo fetch failed (${response.status})`);
  }
  const data = await response.json();
  const current = data.current_weather ?? {};
  const currentTime = current.time;
  let rainProbability = 0;
  let uvIndex = 0;
  if (currentTime && Array.isArray(data.hourly?.time)) {
    const index = data.hourly.time.indexOf(currentTime);
    if (index !== -1) {
      rainProbability = Number(data.hourly.precipitation_probability?.[index] ?? 0);
      uvIndex = Number(data.hourly.uv_index?.[index] ?? 0);
    }
  }
  const temp = Number(current.temperature ?? 0);
  const forecast = rainProbability >= 60 ? 'Showers' : temp >= 25 ? 'Sunny' : 'Partly Cloudy';
  return {
    location: geo.name,
    temperature: temp,
    rainProbability,
    windSpeed: Number(current.windspeed ?? 0),
    uvIndex,
    forecast,
    latitude: geo.latitude,
    longitude: geo.longitude,
  };
}

async function fetchWeatherDirect(location: string): Promise<WeatherSummary> {
  if (!WEATHER_API_KEY) {
    throw new Error('Missing VITE_WEATHER_API_KEY. Set this in your local .env.local and in Vercel environment variables.');
  }

  const encodedLocation = encodeURIComponent(location);
  const url = `https://api.weather-ai.co/v1/weather?location=${encodedLocation}&ai=false&units=metric&days=3`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${WEATHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Direct weather fetch failed (${response.status}): ${text}`);
  }
  const data = await response.json();
  const current = data.current ?? {};
  const temperature = current.temperature ?? current.temp ?? 0;
  const rainProbability = current.precipitation_probability ?? current.precipitationChance ?? current.precipitation ?? 0;
  const windSpeed = current.wind_speed ?? current.windspeed ?? current.windSpeed ?? 0;
  const uvIndex = current.uv_index ?? current.uvIndex ?? 0;
  let forecast = current.condition ?? current.condition_code ?? data.forecast ?? '';
  if (typeof forecast === 'number') forecast = String(forecast);
  const mapConditionCode = (code: number) => {
    if (code === 0) return 'Clear';
    if (code === 1) return 'Mainly Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 50 && code < 60) return 'Light Rain';
    if (code >= 60 && code < 70) return 'Rain';
    if (code >= 70 && code < 80) return 'Snow';
    if (code >= 80) return 'Thunderstorm';
    return String(code);
  };
  if (/^\d+$/.test(String(forecast))) {
    forecast = mapConditionCode(Number(forecast));
  }
  if (!forecast) forecast = 'Partly Cloudy';

  const locationName = data.location?.name || location;
  const lat = Number(data.location?.lat ?? 0);
  const lon = Number(data.location?.lon ?? 0);
  const isInvalidLocationResponse = lat === -1.3005272 && lon === 36.824646 && !location.toLowerCase().includes('nairobi');

  const isMissingWeather = Number(temperature) === 0 && Number(rainProbability) === 0 && Number(windSpeed) === 0 && Number(uvIndex) === 0;

  if (isInvalidLocationResponse || isMissingWeather) {
    return fetchOpenMeteoWeather(location);
  }

  return {
    location: locationName,
    temperature: Number(temperature),
    rainProbability: Number(rainProbability),
    windSpeed: Number(windSpeed),
    uvIndex: Number(uvIndex),
    forecast,
    latitude: lat || undefined,
    longitude: lon || undefined,
  };
}

export async function fetchLiveWeather(location: string): Promise<WeatherSummary> {
  if (BACKEND_URL) {
    return apiFetch(`/api/weather/?location=${encodeURIComponent(location)}`);
  }

  try {
    return await fetchWeatherDirect(location);
  } catch (error) {
    throw error;
  }
}

export async function requestAiSuggestion(question: string, weather: WeatherSummary): Promise<string> {
  const payload = {
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    messages: [
      { role: 'system', content: 'You are WeatherAI Copilot, an intelligent weather assistant designed to help users make real-world decisions with current weather data.' },
      { role: 'user', content: `Current weather data:\n- Location: ${weather.location}\n- Temperature: ${weather.temperature}°C\n- Rain probability: ${weather.rainProbability}%\n- Wind speed: ${weather.windSpeed} km/h\n- UV index: ${weather.uvIndex}\n- Forecast: ${weather.forecast}\n\nQuestion: ${question}` },
    ],
    temperature: 0.25,
    max_tokens: 360,
  };

  if (!OPENROUTER_API_KEY) {
    throw new Error('Missing VITE_OPENROUTER_API_KEY. Set this in your local .env.local and in Vercel environment variables.');
  }

  const response = await fetch('https://openrouter.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? data.result ?? '';
}
