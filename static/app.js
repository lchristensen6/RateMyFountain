// Initialize the map, centered roughly on your area (adjust these coordinates)
const map = L.map('map').setView([40.7829, -73.9654], 13);

var fountain_icon = L.icon({
    iconUrl: iconUrl,

    iconSize:     [38, 45], // size of the icon // size of the shadow
    iconAnchor:   [16,0], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});

// Add the actual map tile imagery from OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

function rateFountain(fountain_id){
    console.log(fountain_id);
    rating = parseInt(window.prompt("Rating of fountain:"));
    if(!rating || rating < 1 || rating > 5){
        console.log("cancelled");
        return 0
    }
    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"score": rating})
    }

    fetch(`/api/fountains/${fountain_id}/ratings`, options)
        .then(response => response.json())
        .then(fountain => 
            console.log(fountain.average_rating),
            map.popup.setContent("hello")
        )
        .catch(error => console.error('Failed to load fountains:', error));
}

map.on('popupopen', (ev) => {
    fetch(`/api/fountains/${ev.popup.fountain.id}/ratings`)
    .then(response => response.json())
    .then(fountain => {
        const rating = fountain.average_rating !== null
                ? `${fountain.average_rating} / 5 (${fountain.rating_count} ratings)`
                : 'No ratings yet';
        ev.popup.setContent(`<strong>${fountain.name}</strong>
                        <br>${fountain.description || ''}
                        <br>"${rating}"
                        <button onclick = "rateFountain(${fountain.id})">Click Me!</button>
                        `)
    })
});
map.on('click', function(ev) {
    // console.log(ev.latlng);
    let lat = ev.latlng.lat;
    let lng = ev.latlng.lng;
    let answer = window.prompt("Name of Water Fountain: ");
    console.log("lat: " + lat + ",lon: " + lng, "answer: " + answer);

    if(!answer || answer == ""){
        console.log("cancelled")
        return null
    }

    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"name": answer, "lat": lat, "lng": lng})

    }
    fetch('/api/fountains', options)
        .then(response => response.json())
        .then(fountain => { 
            popup = L.popup().setContent(`<strong>${fountain.name}</strong>
                    <br>${fountain.description || ''}
                    <br>"No ratings yet"
                    <button onclick = "rateFountain(${fountain.id})">Click Me!</button>
                    `)
            popup.fountain = fountain;
            L.marker([fountain.lat, fountain.lng])
                .addTo(map)
                .bindPopup(popup);
        })
        .catch(error => console.error("Uh oh", error))

});
// Fetch fountains from our own API and add a marker for each
fetch('/api/fountains')
    .then(response => response.json())
    .then(fountains => {
        fountains.forEach(fountain => {
            const rating = fountain.average_rating !== null
                ? `${fountain.average_rating} / 5 (${fountain.rating_count} ratings)`
                : 'No ratings yet';

            popup = L.popup().setContent(`<strong>${fountain.name}</strong>
                    <br>${fountain.description || ''}
                    <br>"${rating}"
                    <button onclick = "rateFountain(${fountain.id})">Click Me!</button>
                    `)
            popup.fountain = fountain;
            L.marker([fountain.lat, fountain.lng], {icon: fountain_icon})
                .addTo(map)
                .bindPopup(popup);
        });
    })
    .catch(error => console.error('Failed to load fountains:', error));
