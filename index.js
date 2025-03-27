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
    if (!location || typeof location.lat === "undefined" || typeof location.lng === "undefined") {
        console.error("Invalid location object:", location);
        return;
    }

    const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`;

    fetch(url)
        .then(response => response.json())
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

                    if (relevantEarthquakes.length > 0) {
                        relevantEarthquakes.forEach(earthquake => {
                            const earthquakeDiv = document.createElement("div");
                            earthquakeDiv.textContent = `Location: ${earthquake.properties.place}, Magnitude: ${earthquake.properties.mag}`;
                            alertsDiv.appendChild(earthquakeDiv);
                        });
                    } else {
                        alertsDiv.textContent = "No recent earthquakes found near this location.";
                    }
                } else {
                    alertsDiv.textContent = "No earthquake data available.";
                }
            }
        })
        .catch(error => {
            console.error("Error fetching earthquake data:", error);
        });
}
function getShelterData(location) {
    const overpassApiUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="shelter"](around:5000,${location.lat},${location.lng});out;`;

    fetch(overpassApiUrl)
        .then(response => {
            if (!response.ok) {
                return Promise.reject(new Error(`HTTP error! status: ${response.status}`));
            }
            return response.json();
        })
        .then(data => {
            console.log("Shelter Data:", data);

            const sheltersDiv = document.getElementById("shelter-message");
            if (sheltersDiv) {
                sheltersDiv.innerHTML = ""; // Clear previous results

                if (data.elements && data.elements.length > 0) {
                    data.elements.forEach(shelter => {
                        const shelterDiv = document.createElement("div");
                        shelterDiv.className = "shelter";

                        // Shelter Name
                        const name = document.createElement("h3");
                        name.textContent = shelter.tags && shelter.tags.name ? shelter.tags.name : "Unnamed Shelter";
                        shelterDiv.appendChild(name);

                        // Shelter Location
                        const location = document.createElement("p");
                        location.textContent = `Location: Lat ${shelter.lat}, Lon ${shelter.lon}`;
                        shelterDiv.appendChild(location);

                        sheltersDiv.appendChild(shelterDiv);
                    });
                } else {
                    sheltersDiv.textContent = "No shelters found near this location.";
                }
            }
        })
        .catch(error => {
            console.error("Error fetching shelter data:", error);
            const sheltersDiv = document.getElementById("shelter-message");
            if (sheltersDiv) {
                sheltersDiv.textContent = "Error fetching shelter data.";
            }
        });
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
/*
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
*/
/*function getShelterData(location) {
    const overpassApiUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="shelter"](around:5000,${location.lat},${location.lng});out;`;

    fetch(overpassApiUrl)
        .then(response => {
            if (!response.ok) {
                return Promise.reject(new Error(`HTTP error! status: ${response.status}`));
            }
            return response.json();
        })
        .then(data => {
            console.log("Shelter Data:", data);

            const sheltersDiv = document.getElementById("shelter-message");
            if (sheltersDiv) {
                sheltersDiv.innerHTML = ""; // Clear previous results

                if (data.elements && data.elements.length > 0) {
                    data.elements.forEach(shelter => {
                        const shelterDiv = document.createElement("div");
                        shelterDiv.className = "shelter";

                        // Shelter Name
                        const name = document.createElement("h3");
                        name.textContent = shelter.tags && shelter.tags.name ? shelter.tags.name : "Unnamed Shelter";
                        shelterDiv.appendChild(name);

                        // Shelter Location
                        const location = document.createElement("p");
                        location.textContent = `Location: Lat ${shelter.lat}, Lon ${shelter.lon}`;
                        shelterDiv.appendChild(location);

                        // Shelter Photo
                        const photo = document.createElement("img");
                        photo.src = `https://via.placeholder.com/300?text=Shelter+Image`; // Placeholder image
                        photo.alt = shelter.tags && shelter.tags.name ? shelter.tags.name : "Shelter Image";
                        photo.className = "shelter-photo";
                        shelterDiv.appendChild(photo);

                        sheltersDiv.appendChild(shelterDiv);
                    });
                } else {
                    sheltersDiv.textContent = "No shelters found near this location.";
                }
            }
        })
        .catch(error => {
            console.error("Error fetching shelter data:", error);
            const sheltersDiv = document.getElementById("shelter-message");
            if (sheltersDiv) {
                sheltersDiv.textContent = "Error fetching shelter data.";
            }
        });
}
*/


function getShelterData(location) {
    const overpassApiUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="shelter"](around:5000,${location.lat},${location.lng});out;`;

    fetch(overpassApiUrl)
        .then(response => {
            if (!response.ok) {
                return Promise.reject(new Error(`HTTP error! status: ${response.status}`));
            }
            return response.json();
        })
        .then(data => {
            const sheltersDiv = document.getElementById("shelter-message");

            if (sheltersDiv) {
                sheltersDiv.innerHTML = ""; 

                if (data.elements && data.elements.length > 0) {
                    data.elements.forEach(shelter => {
                        const shelterDiv = document.createElement("div");
                        shelterDiv.className = "shelter";

                        const name = document.createElement("a");
                        name.textContent = shelter.tags && shelter.tags.name ? shelter.tags.name : "Unnamed Shelter";
                        name.href = `https://www.latlong.net/c/?lat=${shelter.lat}&long=${shelter.lon}`;
                        name.target = "_blank"; 
                        name.style.textDecoration = "none";
                        name.style.color = "#007BFF"; 
                        name.style.fontWeight = "bold";

                        shelterDiv.appendChild(name);

                        // Shelter Location
                        const location = document.createElement("p");
                        location.textContent = `Lat: ${shelter.lat}, Lon: ${shelter.lon}`;
                        shelterDiv.appendChild(location);

                        sheltersDiv.appendChild(shelterDiv);
                    });
                } else {
                    sheltersDiv.textContent = "No shelters found near this location.";
                }
            }
        })
        .catch(error => {
            console.error("Error fetching shelter data:", error);
            const sheltersDiv = document.getElementById("shelter-message");
            if (sheltersDiv) {
                sheltersDiv.textContent = "Error fetching shelter data.";
            }
        });
}

function fetchWikimediaImage(query) {
    const wikimediaApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=original&titles=${encodeURIComponent(
        query
    )}`;

    return fetch(wikimediaApiUrl)
        .then(response => {
            if (!response.ok) {
                return Promise.reject(new Error(`HTTP error! status: ${response.status}`));
            }
            return response.json();
        })
        .then(data => {
            const pages = data.query.pages;
            const page = Object.values(pages)[0];
            return page.original ? page.original.source : null; 
        })
        .catch(error => {
            console.error("Error fetching Wikimedia image:", error);
            return null; 
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
console.log("Location passed to getDisasterData:", location);
getDisasterData(location);
getDisasterData()








console.log("Hello, World!");
