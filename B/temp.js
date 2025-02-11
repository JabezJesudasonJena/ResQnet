let map;
let currentMarker;
let openWeatherApiKey = 'bc4f7737be4a42b16fe20d00b6aae09a'; // Replace with your key
let nasaApiKey = '2ZuZGmoreQ3kiVLf7WrynIIXzAi85wIPTJmzBdlw'; // Replace with your key (if needed)

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 }, // Default center (India)
        zoom: 5,
    });

    currentMarker = null;

    // Set the map center to Ikkadu, Tamil Nadu on initial load
    geocodeLocation("Ikkadu, Tamil Nadu");
}

function geocodeLocation(location) {
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
}

document.getElementById("search-btn").addEventListener("click", function() {
    const location = document.getElementById("search-box").value;
    geocodeLocation(location); // Call the geocoding function
});

// ... (getWeatherData, getDisasterData, getShelterData functions - same as before)

initMap();