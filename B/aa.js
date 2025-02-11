let map;
let currentMarker;
let openWeatherApiKey = 'YOUR_ACTUAL_OPENWEATHER_API_KEY'; // Replace with your key
let nasaApiKey = 'YOUR_ACTUAL_NASA_API_KEY'; // Replace with your key (if needed)

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 }, // Default center (India)
        zoom: 5,
    });

    currentMarker = null;
}

document.getElementById("search-btn").addEventListener("click", function() {
    const location = document.getElementById("search-box").value;
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: location }, (results, status) => {
        if (status === "OK") {
            const location = results[0].geometry.location;
            map.setCenter(location);

            if (currentMarker) {
                currentMarker.setMap(null);
            }

            currentMarker = new google.maps.Marker({
                map: map,
                position: location,
            });

            getWeatherData(results[0].geometry.location);
            getDisasterData(results[0].geometry.location);
            getShelterData(results[0].geometry.location);

        } else {
            alert("Location not found: " + status);
        }
    });
});

function getWeatherData(location) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${openWeatherApiKey}&units=metric`)
        .then(response => response.json())
        .then(data => {
            const temperature = data.main.temp;
            const humidity = data.main.humidity;
            const description = data.weather[0].description;
            const iconCode = data.weather[0].icon;
            const iconUrl = `http://openweathermap.org/img/w/${iconCode}.png`;

            const weatherIcon = document.getElementById("weather-icon");

            if (weatherIcon) {
                weatherIcon.src = iconUrl;
                weatherIcon.alt = description;
                document.getElementById("temperature").textContent = `Temperature: ${temperature}°C`;
                document.getElementById("humidity").textContent = `Humidity: ${humidity}%`;
                document.getElementById("description").textContent = `Description: ${description}`;

            } else {
                console.error("Weather icon element not found!");
            }
        })
        .catch(error => console.error("Error fetching weather data:", error));
}

function getDisasterData(location) {
    const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const alertsDiv = document.getElementById('alerts');
            alertsDiv.innerHTML = '<h2>Disaster Alerts</h2>'; // Clear previous alerts

            if (data.features && data.features.length > 0) {
                data.features.forEach(earthquake => {
                    const magnitude = earthquake.properties.mag;
                    const place = earthquake.properties.place;
                    const time = new Date(earthquake.properties.time);
                    const alertMessage = `<p><b>Earthquake:</b> ${place} (Magnitude ${magnitude}) - ${time.toLocaleString()}</p>`;
                    alertsDiv.innerHTML += alertMessage;
                });
            } else {
                alertsDiv.innerHTML += '<p id="alert-message">No recent earthquakes found.</p>';
            }
        })
        .catch(error => console.error("Error fetching earthquake data:", error));
}

function getShelterData(location) {
    const shelterList = document.getElementById('shelter-list');
    shelterList.innerHTML = ""; // Clear previous results

    // Placeholder: Replace with actual shelter API or data source.
    const shelters = [
        { name: "Shelter A", lat: location.lat + 0.01, lng: location.lng + 0.01, address: "123 Main St" },
        { name: "Shelter B", lat: location.lat - 0.02, lng: location.lng - 0.02, address: "456 Oak Ave" },
    ];

    if (shelters.length > 0) {
        shelters.forEach(shelter => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<h3>${shelter.name}</h3><p>${shelter.address}</p>`;
            shelterList.appendChild(listItem);

            new google.maps.Marker({
                map: map,
                position: {
                    lat: shelter.lat,
                    lng: shelter.lng
                },
                icon: {
                    url: "http://maps.google.com/mapfiles/kml/paddle/red-circle.png" // Customize icon
                }
            });
        });
    } else {
        document.getElementById('shelter-message').textContent = "No shelters found near this location.";
    }
}



initMap();