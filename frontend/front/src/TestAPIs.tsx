import { useState } from 'react';

export function TestAPIs() {
  const [weatherResult, setWeatherResult] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWeatherAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_WEATHER_API_KEY not set in .env.local');
      }

      const response = await fetch(
        'https://api.weather-ai.co/v1/weather?location=Nairobi&ai=false&units=metric&days=3',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setWeatherResult(data);
    } catch (err: any) {
      setError(`Weather API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testOpenRouterAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_OPENROUTER_API_KEY not set in .env.local');
      }

      const response = await fetch('https://openrouter.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-super-120b-a12b:free',
          messages: [
            {
              role: 'user',
              content: 'Say hello! Keep it short.',
            },
          ],
          temperature: 0.25,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err: any) {
      setError(`OpenRouter API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Test Console</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testWeatherAPI} disabled={loading}>
          Test Weather API
        </button>
        {weatherResult && (
          <pre style={{ background: '#f0f0f0', padding: '10px', marginTop: '10px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(weatherResult, null, 2).slice(0, 500)}...
          </pre>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testOpenRouterAPI} disabled={loading}>
          Test OpenRouter API
        </button>
        {aiResult && (
          <pre style={{ background: '#f0f0f0', padding: '10px', marginTop: '10px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(aiResult, null, 2).slice(0, 500)}...
          </pre>
        )}
      </div>

      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffe0e0' }}>
          {error}
        </div>
      )}

      {loading && <p>Loading...</p>}
    </div>
  );
}
