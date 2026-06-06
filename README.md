# 🌤️ WeatherAI Copilot

A modern AI-powered weather dashboard and decision-making assistant. Get real-time weather forecasts and intelligent suggestions for your activities—whether you're farming, planning a beach trip, or any other weather-dependent task.

---

## ✨ Features

- **Live Weather Dashboard**
  - Real-time weather data from the WeatherAI API
  - Beautiful, responsive UI with dynamic backgrounds
  - Current conditions, forecasts, and weather metrics
  - Support for multiple preset locations and custom searches

- **AI-Powered Copilot Chat**
  - Ask weather-related decision questions ("Should I go to the beach?")
  - AI analysis powered by OpenRouter
  - Safety scoring and confidence metrics
  - Full audit trail with reasoning explanations

- **Weather Simulator**
  - Adjust temperature, rain probability, wind speed, UV index
  - Real-time condition updates
  - Test "what-if" scenarios

- **Route Planner**
  - Compare weather at start and end destinations
  - Plan journeys with weather awareness
  - Side-by-side weather comparison

- **Dark/Light Theme**
  - Toggle between themes
  - Persistent user preference

---

## 🏗️ Architecture

```
weather-assistant/
├── backend/                 # Django REST API
│   ├── myproject/
│   │   ├── myapp/          # Weather & AI endpoints
│   │   │   ├── views.py    # API handlers
│   │   │   └── urls.py     # Routing
│   │   └── settings.py     # Configuration
│   ├── requirements.txt     # Python dependencies
│   ├── Procfile            # Render deployment
│   └── runtime.txt         # Python version
│
├── frontend/front/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx         # Main component
│   │   ├── App.css         # Styles
│   │   └── lib/
│   │       └── backendApi.ts  # Backend client
│   ├── package.json        # Node dependencies
│   └── vercel.json         # Vercel deployment
│
└── render.yaml             # Render Blueprint (backend)
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** – Fast build tool
- **Tailwind CSS** – Utility-first styling
- **Recharts** – Weather charts & visualization
- **Responsive Design** – Mobile & desktop support

### Backend
- **Django 6.0** – Python web framework
- **Gunicorn** – WSGI server
- **Open-Meteo API** – Weather fallback (free)
- **WeatherAI API** – Premium weather data
- **OpenRouter API** – AI suggestions

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (for frontend)
- **Python 3.14+** (for backend)

### Frontend Setup

```bash
cd frontend/front
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export WEATHER_API_KEY=your_key
export OPENROUTER_API_KEY=your_key

# Run server
python myproject/manage.py runserver
```
Backend runs on `http://localhost:8000`

---

## 🔑 Environment Variables

### Backend (`.env` or system env vars)

```bash
WEATHER_API_KEY=wai_xxxxx              # WeatherAI API key
OPENROUTER_API_KEY=sk-or-v1-xxxxx      # OpenRouter API key
WEATHER_API_BASE=https://api.weather-ai.co  # Weather API endpoint
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free  # LLM model
ALLOWED_HOSTS=localhost,127.0.0.1,weather-assistant-t0ds.onrender.com
```

### Frontend (Vercel env vars)

```bash
VITE_BACKEND_URL=https://weather-assistant-t0ds.onrender.com
```

---

## 📡 API Endpoints

### Weather Endpoint

**GET** `/api/weather/`

Query Parameters:
- `location` (string) – Location name (e.g., "Nairobi, Kenya")

Response:
```json
{
  "location": "Nairobi, Kenya",
  "temperature": 25.7,
  "rainProbability": 0.0,
  "windSpeed": 11.9,
  "uvIndex": 0.0,
  "forecast": "Sunny"
}
```

Fallback: If WeatherAI API fails, uses Open-Meteo (free, always available)

### AI Suggestion Endpoint

**POST** `/api/ai-suggestion/`

Request Body:
```json
{
  "question": "Should I go to the beach?",
  "weather": {
    "location": "Mombasa, Kenya",
    "temperature": 28,
    "rainProbability": 5,
    "windSpeed": 15,
    "uvIndex": 8,
    "forecast": "Sunny"
  }
}
```

Response:
```json
{
  "suggestion": "Yes, perfect beach weather! High sun, minimal rain..."
}
```

---

## 🌐 Deployment

### Backend – Render

Deployed at: `https://weather-assistant-t0ds.onrender.com`

1. Connect your GitHub repo to Render
2. Create a new web service with the `render.yaml` Blueprint
3. Set environment variables in Render dashboard:
   - `WEATHER_API_KEY`
   - `OPENROUTER_API_KEY`
4. Deploy!

**Service Details:**
- Python 3.14.3
- Gunicorn server
- Auto-deploys on push to `main`

### Frontend – Vercel

Deployed at: `https://weather-assistant.vercel.app` (example URL)

1. Import your GitHub repo into Vercel
2. Set root directory to `frontend/front`
3. Set `VITE_BACKEND_URL` to your Render backend URL
4. Deploy!

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`

---

## 🎯 Usage

### For Users

1. **Open the dashboard** → Click "Launch Copilot" on the landing page
2. **View weather** → Select a preset location or fetch live weather
3. **Ask questions** → Type a decision question in the chat (e.g., "Can I play tennis?")
4. **Get AI response** → Receive smart suggestions based on current weather
5. **Plan routes** → Compare weather between two locations
6. **Try scenarios** → Use the weather simulator to test "what-if" conditions

### For Developers

**Frontend Development:**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code quality
```

**Backend Development:**
```bash
python manage.py runserver           # Start dev server
python manage.py test                # Run tests
python manage.py migrate             # Apply migrations
```

---

## 🔐 Security Notes

- **API Keys** are never committed to the repo
- Use Render/Vercel environment variables for secrets
- `ALLOWED_HOSTS` restricts access to trusted domains
- Frontend routes API calls through the backend when deployed

---

## 📊 How It Works

### Weather Flow

1. User requests weather for a location
2. Frontend calls `/api/weather/?location=...`
3. Backend geocodes location using OpenStreetMap
4. Fetches data from WeatherAI API (with Open-Meteo fallback)
5. Returns formatted weather JSON to frontend
6. UI renders with dynamic background based on forecast

### AI Suggestion Flow

1. User types a question in chat
2. Frontend calls `/api/ai-suggestion/` with question + current weather
3. Backend analyzes weather using local heuristics
4. Sends to OpenRouter API for enhanced reasoning
5. Returns suggestion with confidence score
6. Chat displays response with audit trail

---

## 🐛 Troubleshooting

### Frontend can't reach backend
- Check `VITE_BACKEND_URL` in Vercel env vars
- Verify Render backend is running (`https://weather-assistant-t0ds.onrender.com`)
- Check Vercel `vercel.json` routes configuration

### Weather API returns 500 error
- Ensure `WEATHER_API_KEY` is set in Render
- Check WeatherAI API status or switch to Open-Meteo fallback
- Verify location geocoding works

### AI suggestions not working
- Confirm `OPENROUTER_API_KEY` is set in Render
- Check OpenRouter API quota/limits
- Try local fallback analysis (always available)

---

## 📝 Project Structure

- **Landing Page** – Feature overview, topic samples, call-to-action
- **Dashboard** – Main weather view with simulator and chat
- **Route Planner** – Dedicated page for comparing two locations
- **Chat Interface** – AI conversation with audit trail
- **Responsive Mobile** – Optimized for phone/tablet screens

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m "Add amazing feature"`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 📧 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API response logs
3. Open an issue on GitHub

---

**Built with ❤️ using React, Django, and AI**
