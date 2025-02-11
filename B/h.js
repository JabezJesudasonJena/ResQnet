let map;
let currentMarker;
let openWeatherApiKey = 'a94fde3e51148f0747e94d41dc8d0f6b';

function getWeatherData(location) {
    const apiKey = openWeatherApiKey;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${apiKey}&units=metric`;

    console.log("Weather API URL:", url);

    fetch(url)
        .then(response => {
            if (!response.ok) {
                return Promise.reject(new Error(`HTTP error! status: ${response.status}`));
            }
            return response.json();
        })
        .then(data => {
            console.log("Weather Data:", data);

            const iconCode = data.weather[0].icon;
            const iconUrl = `http://openweathermap.org/img/w/${iconCode}.png`;

            const weatherIcon = document.getElementById("weather-icon");
            if (weatherIcon) {
                weatherIcon.src = iconUrl;
                weatherIcon.alt = data.weather[0].description;
            }

            document.getElementById("temperature").textContent = `Temperature: ${data.main.temp}°C`;
            document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
            document.getElementById("description").textContent = data.weather[0].description;
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
        });
}

function getDisasterData(location) {
    document.getElementById("alert-message").textContent = "Disaster data will be displayed here.";
}

function getShelterData(location) {
    document.getElementById("shelter-message").textContent = "Shelter data will be displayed here.";
}

document.addEventListener('DOMContentLoaded', function() {
    map = L.map('map').setView([13.4682, 80.1702], 1000);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    }).addTo(map);
    

    currentMarker = L.marker([13.4682, 80.1702]).addTo(map)
        .bindPopup('Ikkadu, Tamil Nadu')
        .openPopup();

    getWeatherData({ lat: 13.4682, lng: 80.1702 });
    getDisasterData({ lat: 13.4682, lng: 80.1702 });
    getShelterData({ lat: 13.4682, lng: 80.1702 });
});

document.getElementById("search-btn").addEventListener("click", function() {
    const location = document.getElementById("search-box").value;
    const encodedLocation = encodeURIComponent(location);

    console.log("Searching for:", location);
    console.log("Encoded Location:", encodedLocation);

    fetch(`https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Nominatim Response:", data);

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                console.log("Coordinates:", lat, lon);

                map.setView([lat, lon], 10);

                if (currentMarker) {
                    currentMarker.setLatLng([lat, lon]);
                    currentMarker.bindPopup(data[0].display_name).openPopup();
                } else {
                    currentMarker = L.marker([lat, lon]).addTo(map)
                        .bindPopup(data[0].display_name)
                        .openPopup();
                }

                getWeatherData({ lat: lat, lng: lon });
                getDisasterData({ lat: lat, lng: lon });
                getShelterData({ lat: lat, lng: lon });

            } else {
                alert("Location not found.");
            }
        })
        .catch(error => {
            console.error("Error fetching location:", error);
            alert("Error fetching location. Please try again later.");
        });
});

function getDisasterData(location) {
    const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`;

    fetch(url)
        .then(response => { 
        })
        .then(data => {
            console.log("Earthquake Data:", data); 

            const alertsDiv = document.getElementById("alert-message");
            if (alertsDiv) {
                alertsDiv.innerHTML = ""; 

                if (data.features && data.features.length > 0) {
                    const earthquakes = data.features;
                    const relevantEarthquakes = earthquakes.filter(earthquake => {
                        const earthquakeLat = earthquake.geometry.coordinates[1];
                        const earthquakeLon = earthquake.geometry.coordinates[0];
                        const distance = calculateDistance(location.lat, location.lng, earthquakeLat, earthquakeLon);
                        return distance <= 200; 
                    });

                    console.log("Relevant Earthquakes:", relevantEarthquakes); 

                    if (relevantEarthquakes.length > 0) {
                        relevantEarthquakes.forEach(earthquake => {
                            
                        });
                    } else {
                        alertsDiv.textContent = "No recent earthquakes found near this location.";
                    }
                } else {
                    alertsDiv.textContent = "No recent earthquakes found.";
                }
            }
        })
        .catch(error => {
            console.error("Error fetching earthquake data:", error);
            const alertsDiv = document.getElementById("alert-message");
            if (alertsDiv) {
                alertsDiv.textContent = "Error fetching earthquake data.";
            }
        });
}


function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; 
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}   

calculateDistance();
deg2rad();
getDisasterData()