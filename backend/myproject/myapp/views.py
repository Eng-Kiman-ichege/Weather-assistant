import datetime
import json
import ssl
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.http import HttpResponseBadRequest, HttpResponseServerError, JsonResponse
from django.views.decorators.http import require_http_methods

OPENROUTER_URL = 'https://openrouter.ai/v1/chat/completions'


def _create_ssl_context() -> ssl.SSLContext:
    context = ssl.create_default_context()
    try:
        import certifi
        context.load_verify_locations(cafile=certifi.where())
    except Exception:
        pass
    return context


def _fetch_json(url: str, headers: dict) -> dict:
    request = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(request, timeout=15, context=_create_ssl_context()) as response:
            body = response.read().decode('utf-8')
            return json.loads(body)
    except (ssl.SSLCertVerificationError, urllib.error.URLError) as exc:
        if isinstance(exc, urllib.error.URLError) and not isinstance(exc.reason, ssl.SSLCertVerificationError):
            raise
        with urllib.request.urlopen(request, timeout=15, context=ssl._create_unverified_context()) as response:
            body = response.read().decode('utf-8')
            return json.loads(body)


def _post_json(url: str, payload: dict, headers: dict) -> dict:
    data = json.dumps(payload).encode('utf-8')
    request = urllib.request.Request(url, headers=headers, data=data, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=20, context=_create_ssl_context()) as response:
            body = response.read().decode('utf-8')
            return json.loads(body)
    except ssl.SSLCertVerificationError:
        with urllib.request.urlopen(request, timeout=20, context=ssl._create_unverified_context()) as response:
            body = response.read().decode('utf-8')
            return json.loads(body)


def _geocode_location(location: str) -> dict | None:
    headers = {'User-Agent': 'WeatherAI/1.0'}
    nominatim_url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(location)}&limit=1"
    try:
        result = _fetch_json(nominatim_url, headers)
    except Exception:
        result = None

    if result and isinstance(result, list) and len(result) > 0:
        first = result[0]
        try:
            return {
                'latitude': float(first.get('lat', 0)),
                'longitude': float(first.get('lon', 0)),
            }
        except (TypeError, ValueError):
            pass

    open_meteo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(location)}&count=1"
    try:
        payload = _fetch_json(open_meteo_url, headers)
        results = payload.get('results')
        if isinstance(results, list) and len(results) > 0:
            best = results[0]
            return {
                'latitude': float(best.get('latitude', 0)),
                'longitude': float(best.get('longitude', 0)),
            }
    except Exception:
        pass

    return None


def _forecast_from_open_meteo(data: dict, location: str) -> dict:
    current = data.get('current_weather', {})
    hourly = data.get('hourly', {})
    time_index = None
    current_time = current.get('time')

    if current_time and isinstance(hourly.get('time'), list):
        try:
            time_index = hourly['time'].index(current_time)
        except ValueError:
            time_index = None

    temp = float(current.get('temperature', 0) or 0)
    wind = float(current.get('windspeed', 0) or 0)
    rain = float(hourly.get('precipitation_probability', [0])[time_index] if time_index is not None else 0) if isinstance(hourly.get('precipitation_probability'), list) else 0
    uv = float(hourly.get('uv_index', [0])[time_index] if time_index is not None else 0) if isinstance(hourly.get('uv_index'), list) else 0

    forecast = 'Partly Cloudy'
    if rain >= 60:
        forecast = 'Showers'
    elif rain >= 20:
        forecast = 'Cloudy'
    elif temp >= 25:
        forecast = 'Sunny'

    return {
        'location': location,
        'temperature': temp,
        'rainProbability': rain,
        'windSpeed': wind,
        'uvIndex': uv,
        'forecast': forecast,
    }


from django.views.decorators.csrf import csrf_exempt

@require_http_methods(['GET'])
def weather_view(request):
    location = request.GET.get('location', 'Nairobi').strip()
    if not location:
        return HttpResponseBadRequest('Missing location parameter.')

    if settings.WEATHER_API_KEY:
        encoded = urllib.parse.quote(location)
        url = f"{settings.WEATHER_API_BASE}/v1/weather?location={encoded}&ai=false&units=metric&days=3"
        headers = {
            'Authorization': f'Bearer {settings.WEATHER_API_KEY}',
            'Content-Type': 'application/json',
        }

        try:
            data = _fetch_json(url, headers)
        except Exception as exc:
            return HttpResponseServerError(f'Failed to fetch weather: {exc}')

    raw_location = data.get('location', location)
    normalized_location = location
    if isinstance(raw_location, str):
        normalized_location = raw_location
    elif isinstance(raw_location, dict):
        normalized_location = raw_location.get('name') or raw_location.get('display_name') or location

    return JsonResponse({
        'location': normalized_location,
        })

    coords = _geocode_location(location)
    if not coords:
        return HttpResponseServerError('Unable to resolve location coordinates from OpenStreetMap.')

    open_meteo_url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={coords['latitude']}&longitude={coords['longitude']}"
        f"&hourly=temperature_2m,precipitation_probability,windspeed_10m,uv_index&current_weather=true&timezone=auto"
    )
    try:
        data = _fetch_json(open_meteo_url, {'User-Agent': 'WeatherAI/1.0'})
    except Exception as exc:
        return HttpResponseServerError(f'Failed to fetch weather fallback: {exc}')

    forecast_payload = _forecast_from_open_meteo(data, location)
    return JsonResponse(forecast_payload)


@csrf_exempt
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
