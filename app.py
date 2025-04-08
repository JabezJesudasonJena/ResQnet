from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import datetime
import google.generativeai as genai

# Load .env variables early
load_dotenv()

app = Flask(__name__)
CORS(app)

# API Keys
WEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
api_key = os.getenv("GEMINI_API_KEY")

# Configure Gemini
genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel("gemini-1.5-pro-002")

# Functions...
# (Leave all your existing helper functions the same)

# Routes
@app.route("/")
def home():
    return "EchoAI Flask Backend is Running!"

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message").lower()

    if "weather in" in user_input:
        try:
            city = user_input.split("weather in ")[1].strip()
            weather_data = get_weather(city, WEATHER_API_KEY)
            if isinstance(weather_data, dict):
                response = (
                    f"🌤️ Weather in {weather_data['city']}:\n"
                    f"Temperature: {weather_data['temperature']}°C\n"
                    f"Description: {weather_data['description']}\n"
                    f"Humidity: {weather_data['humidity']}%\n"
                    f"Pressure: {weather_data['pressure']} hPa"
                )
            else:
                response = weather_data
        except IndexError:
            response = "Please provide a city name after 'weather in'."

    elif "forecast for" in user_input or "forecast" in user_input:
        try:
            city = user_input.split("forecast for ")[1].strip() if "forecast for" in user_input else user_input.split("forecast")[1].strip()
            forecast_data = get_forecast(city, WEATHER_API_KEY)
            if isinstance(forecast_data, list):
                response = f"📅 Forecast for {city}:\n"
                for forecast in forecast_data:
                    response += f"{forecast['datetime']}: {forecast['temperature']}°C, {forecast['description']}\n"
            else:
                response = forecast_data
        except IndexError:
            response = "Please provide a city name after 'forecast'."

    elif any(word in user_input for word in ["disaster", "earthquake", "flood", "cyclone", "fire", "hello"]):
        response = get_disaster_guidance(user_input)

    else:
        response = ask_gemini(user_input)

    return jsonify({"reply": response})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))