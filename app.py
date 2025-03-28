from flask import Flask, render_template, request, jsonify
import requests
import datetime

app = Flask(__name__)

# Replace with your OpenWeatherMap API key
API_KEY = "bc4f7737be4a42b16fe20d00b6aae09a"


def get_weather(city, api_key):
    base_url = "http://api.openweathermap.org/data/2.5/weather?"
    complete_url = f"{base_url}appid={api_key}&q={city}&units=metric"

    try:
        response = requests.get(complete_url)
        response.raise_for_status()
        x = response.json()

        if x["cod"] != "404":
            y = x["main"]
            weather_data = {
                "temperature": y["temp"],
                "pressure": y["pressure"],
                "humidity": y["humidity"],
                "description": x["weather"][0]["description"],
                "city": city,
            }
            return weather_data
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
            forecast_data = [
                {
                    "datetime": datetime.datetime.fromtimestamp(item["dt"]).strftime("%Y-%m-%d %H:%M:%S"),
                    "temperature": item["main"]["temp"],
                    "description": item["weather"][0]["description"],
                }
                for item in x["list"][:5]  # Fetch next 5 forecasts
            ]
            return forecast_data
        else:
            return "City not found"
    except requests.exceptions.RequestException as e:
        return f"Error: {e}"


@app.route("/")
def home():
    return render_template("chatbot.html")


@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message").lower()

    if "weather in" in user_input:
        city = user_input.split("weather in ")[1].strip()
        weather_data = get_weather(city, API_KEY)
        if isinstance(weather_data, dict):
            response = (
                f"Weather in {weather_data['city']}:\n"
                f"Temperature: {weather_data['temperature']}°C\n"
                f"Description: {weather_data['description']}\n"
                f"Humidity: {weather_data['humidity']}%\n"
                f"Pressure: {weather_data['pressure']} hPa"
            )
        else:
            response = weather_data

    elif "forecast for" in user_input:
        city = user_input.split("forecast for ")[1].strip()
        forecast_data = get_forecast(city, API_KEY)
        if isinstance(forecast_data, list):
            response = f"Forecast for {city}:\n"
            for forecast in forecast_data:
                response += f"{forecast['datetime']}: {forecast['temperature']}°C, {forecast['description']}\n"
        else:
            response = forecast_data

    elif "disaster" in user_input:
        response = "Disaster alert service is currently unavailable. Check GDACS website for updates."

    else:
        response = "I don't understand. Please ask about weather, forecast, or disasters."

    return jsonify({"reply": response})


if __name__ == "__main__":
    app.run(debug=True)