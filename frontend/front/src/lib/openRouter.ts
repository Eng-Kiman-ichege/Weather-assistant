export interface WeatherSummary {
  location: string;
  temperature: number;
  rainProbability: number;
  windSpeed: number;
  uvIndex: number;
  forecast: string;
}

const OPENROUTER_URL = 'https://openrouter.ai/v1/chat/completions';
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

export async function createAiSuggestion(question: string, weather: WeatherSummary) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured. Set VITE_OPENROUTER_API_KEY in your environment.');
  }

  const systemMessage = `You are WeatherAI Copilot, an intelligent weather assistant designed to help users make real-world decisions using weather data.`;
  const userMessage = `Current weather data:\n- Location: ${weather.location}\n- Temperature: ${weather.temperature}°C\n- Rain probability: ${weather.rainProbability}%\n- Wind speed: ${weather.windSpeed} km/h\n- UV index: ${weather.uvIndex}\n- Forecast: ${weather.forecast}\n\nUser question: ${question}\n\nProvide a concise answer, a short explanation, and one clear recommendation.`;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.25,
      max_tokens: 360,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? data?.output?.[0]?.content ?? '';
}
