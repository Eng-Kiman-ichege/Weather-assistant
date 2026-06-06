export interface WeatherSummary {
  location: string;
  temperature: number;
  rainProbability: number;
  windSpeed: number;
  uvIndex: number;
  forecast: string;
}

export async function fetchLiveWeather(location: string): Promise<WeatherSummary> {
  const response = await fetch(`/api/weather/?location=${encodeURIComponent(location)}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Live weather fetch failed: ${errorText}`);
  }
  return response.json();
}

export async function requestAiSuggestion(question: string, weather: WeatherSummary): Promise<string> {
  const response = await fetch('/api/ai-suggestion/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, weather }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI suggestion request failed: ${errorText}`);
  }

  const data = await response.json();
  return data.suggestion ?? '';
}
