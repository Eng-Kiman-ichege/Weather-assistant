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
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.trim() || (import.meta.env.DEV ? DEFAULT_REMOTE_BACKEND : '');

async function apiFetch(path: string, options?: RequestInit) {
  const url = BACKEND_URL ? `${BACKEND_URL}${path}` : path;
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend request failed (${response.status}): ${errorText}`);
  }
  return response.json();
}

export async function fetchLiveWeather(location: string): Promise<WeatherSummary> {
  return apiFetch(`/api/weather/?location=${encodeURIComponent(location)}`);
}

export async function requestAiSuggestion(question: string, weather: WeatherSummary): Promise<string> {
  const data = await apiFetch('/api/ai-suggestion/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, weather }),
  });
  return data.suggestion ?? '';
}
