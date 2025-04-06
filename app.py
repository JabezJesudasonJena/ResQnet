from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import requests
import datetime
import google.generativeai as genai

app = Flask(__name__)

# OpenWeatherMap API key
WEATHER_API_KEY = "bc4f7737be4a42b16fe20d00b6aae09a"


load_dotenv()


api_key = os.getenv("gemni.env")

genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel("gemini-1.5-pro-002")



def get_weather(city, api_key):
    base_url = "http://api.openweathermap.org/data/2.5/weather?"
    complete_url = f"{base_url}appid={api_key}&q={city}&units=metric"
    try:
        response = requests.get(complete_url)
        response.raise_for_status()
        x = response.json()
        if x["cod"] != "404":
            y = x["main"]
            return {
                "temperature": y["temp"],
                "pressure": y["pressure"],
                "humidity": y["humidity"],
                "description": x["weather"][0]["description"],
                "city": city,
            }
        else:
            return "City not found"
    except requests.exceptions.RequestException as e:
        return f"Error: {e}"



def get_forecast(city, api_key):
    base_url = "http://api.openweathermap.org/data/2.5/forecast?"
    complete_url = f"{base_url}appid={api_key}&q={city}&units=metric"
    try:
        response = requests.get(complete_url)
        response.raise_for_status()
        x = response.json()
        if x["cod"] != "404":
            return [
                {
                    "datetime": datetime.datetime.fromtimestamp(item["dt"]).strftime("%Y-%m-%d %H:%M:%S"),
                    "temperature": item["main"]["temp"],
                    "description": item["weather"][0]["description"],
                }
                for item in x["list"][:5]
            ]
        else:
            return "City not found"
    except requests.exceptions.RequestException as e:
        return f"Error: {e}"



def get_disaster_guidance(message):
    message = message.lower()
    if "earthquake" in message:
        return (
            "🛑 Earthquake Safety Tips:\n"
            "- Drop, Cover, and Hold On.\n"
            "- Stay away from windows.\n"
            "- If indoors, stay there. If outdoors, move to an open area.\n"
            "- After shaking stops, evacuate if necessary and check for injuries."
        )
    elif "flood" in message:
        return (
            "🌊 Flood Safety Tips:\n"
            "- Move to higher ground immediately.\n"
            "- Avoid walking or driving through flood waters.\n"
            "- Turn off utilities if instructed.\n"
            "- Listen to local alerts and emergency instructions."
        )
    elif "cyclone" in message or "hurricane" in message:
        return (
            "🌪️ Cyclone Safety Tips:\n"
            "- Stay indoors and away from windows.\n"
            "- Prepare an emergency kit with water, food, and first aid.\n"
            "- Evacuate if officials say so.\n"
            "- Stay tuned to weather updates via radio or phone."
        )
    elif "fire" in message:
        return (
            "🔥 Fire Safety Tips:\n"
            "- Evacuate the area immediately.\n"
            "- Do not use elevators.\n"
            "- If there's smoke, crawl low under it.\n"
            "- Call emergency services once safe."
        )
    elif "disaster" in message:
        return (
            "🚨 General Disaster Tips:\n"
            "- Stay calm and think clearly.\n"
            "- Contact emergency services if needed.\n"
            "- Follow local authority instructions.\n"
            "- Keep emergency supplies ready."
        )
    elif "hello" in message:
        return (
            "Hello This is a Echo Ai of Resqnet. I am here to help you with your queries.\n"
        )

    else:
        return "Please specify the type of disaster (earthquake, flood, cyclone, etc.)."



def ask_gemini(prompt):
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error from Gemini: {e}"



@app.route("/")
def home():
    return render_template("chatbot.html")



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
    app.run(debug=True)
