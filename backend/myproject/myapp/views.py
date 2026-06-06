import json
import urllib.parse
import urllib.request

from django.conf import settings
from django.http import HttpResponseBadRequest, HttpResponseServerError, JsonResponse
from django.views.decorators.http import require_http_methods

OPENROUTER_URL = 'https://openrouter.ai/v1/chat/completions'


def _fetch_json(url: str, headers: dict) -> dict:
    request = urllib.request.Request(url, headers=headers, method='GET')
    with urllib.request.urlopen(request, timeout=15) as response:
        body = response.read().decode('utf-8')
        return json.loads(body)


def _post_json(url: str, payload: dict, headers: dict) -> dict:
    data = json.dumps(payload).encode('utf-8')
    request = urllib.request.Request(url, headers=headers, data=data, method='POST')
    with urllib.request.urlopen(request, timeout=20) as response:
        body = response.read().decode('utf-8')
        return json.loads(body)


@require_http_methods(['GET'])
def weather_view(request):
    location = request.GET.get('location', 'Nairobi').strip()
    if not location:
        return HttpResponseBadRequest('Missing location parameter.')

    if not settings.WEATHER_API_KEY:
        return HttpResponseServerError('Weather API key is not configured on the backend.')

    encoded = urllib.parse.quote(location)
    url = f"{settings.WEATHER_API_BASE}/v1/current?location={encoded}"
    headers = {
        'Authorization': f'Bearer {settings.WEATHER_API_KEY}',
        'Content-Type': 'application/json',
    }

    try:
        data = _fetch_json(url, headers)
    except Exception as exc:
        return HttpResponseServerError(f'Failed to fetch weather: {exc}')

    return JsonResponse({
        'location': data.get('location', location),
        'temperature': float(data.get('temperature', data.get('temp', 0)) or 0),
        'rainProbability': float(data.get('rainProbability', data.get('precipitationChance', 0)) or 0),
        'windSpeed': float(data.get('windSpeed', data.get('wind_speed', 0)) or 0),
        'uvIndex': float(data.get('uvIndex', data.get('uv_index', 0)) or 0),
        'forecast': str(data.get('forecast', data.get('summary', 'Partly Cloudy'))),
    })


@require_http_methods(['POST'])
def ai_suggestion_view(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return HttpResponseBadRequest('Invalid JSON body.')

    question = payload.get('question')
    weather = payload.get('weather')
    if not question or not weather:
        return HttpResponseBadRequest('Both question and weather data are required.')

    if not settings.OPENROUTER_API_KEY:
        return HttpResponseServerError('OpenRouter API key is not configured on the backend.')

    system_message = 'You are WeatherAI Copilot, an intelligent weather assistant designed to help users make real-world decisions using weather data.'
    user_message = (
        f"Current weather data:\n"
        f"- Location: {weather.get('location')}\n"
        f"- Temperature: {weather.get('temperature')}°C\n"
        f"- Rain probability: {weather.get('rainProbability')}%\n"
        f"- Wind speed: {weather.get('windSpeed')} km/h\n"
        f"- UV index: {weather.get('uvIndex')}\n"
        f"- Forecast: {weather.get('forecast')}\n\n"
        f"User question: {question}\n\n"
        'Provide a concise answer, a short explanation, and one clear recommendation.'
    )

    body = {
        'model': settings.OPENROUTER_MODEL,
        'messages': [
            {'role': 'system', 'content': system_message},
            {'role': 'user', 'content': user_message},
        ],
        'temperature': 0.25,
        'max_tokens': 360,
    }
    headers = {
        'Authorization': f'Bearer {settings.OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
    }

    try:
        response = _post_json(OPENROUTER_URL, body, headers)
    except Exception as exc:
        return HttpResponseServerError(f'OpenRouter request failed: {exc}')

    suggestion = ''
    if response.get('choices') and len(response['choices']) > 0:
        suggestion = response['choices'][0].get('message', {}).get('content', '')
    elif response.get('output') and len(response['output']) > 0:
        suggestion = response['output'][0].get('content', '')

    return JsonResponse({'suggestion': suggestion})
