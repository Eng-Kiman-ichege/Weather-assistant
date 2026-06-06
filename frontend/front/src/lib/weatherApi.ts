export interface WeatherRecord {
  location: string;
  temperature: number;
  rainProbability: number;
  windSpeed: number;
  uvIndex: number;
  forecast: string;
}

const WEATHER_API_BASE = import.meta.env.VITE_WEATHER_API_BASE || 'https://api.weather-ai.co';

export async function fetchWeatherForLocation(location: string): Promise<WeatherRecord> {
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('Weather API key is not configured. Set VITE_WEATHER_API_KEY in your environment.');
  }

  const url = `${WEATHER_API_BASE}/v1/current?location=${encodeURIComponent(location)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Weather API request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    location: data.location ?? location,
    temperature: Number(data.temperature ?? data.temp ?? 22),
    rainProbability: Number(data.rainProbability ?? data.precipitationChance ?? 20),
    windSpeed: Number(data.windSpeed ?? data.wind_speed ?? 8),
    uvIndex: Number(data.uvIndex ?? data.uv_index ?? 5),
    forecast: String(data.forecast ?? data.summary ?? 'Partly Cloudy'),
  };
}
