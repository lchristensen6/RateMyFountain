// Initialize the map, centered roughly on your area (adjust these coordinates)
const map = L.map('map').setView([40.7829, -73.9654], 13);

points = {};

function updatePoint(fountain){
    const rating = fountain.average_rating !== null
                ? `${fountain.average_rating} / 5 (${fountain.rating_count} ratings)`
                : 'No ratings yet';
        return `<strong>${fountain.name}</strong>
                <br>${fountain.description || ''}
                <br>"${rating}"
                <button onclick = "rateFountain(${fountain.id})">Click Me!</button>
                `
}
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

function openSidebar(fountain_id){
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('open');

    const sidebartext = document.querySelector('.sidebartext');

    const closeButton = document.getElementById('closeSidebar');
    closeButton.addEventListener('click', () => sidebar.classList.remove('open'));
    
    fetch(`/api/fountains/${fountain_id}`)
    .then(response => response.json())
    .then(list => {
        text = "";
        list.forEach((list_item) => {
            text += `Rating: ${list_item.score ? list_item.score : "None"}, 
            Comment: ${list_item.comment ? list_item.comment : "None"}, Date: ${list_item.created_at ? list_item.created_at : "None"}\n`
        });
        sidebartext.setAttribute('style', 'white-space: pre-line;');
        sidebartext.textContent = text;
        
    })



}
function rateFountain(fountain_id){
    rating = parseInt(window.prompt("Rating of fountain:"));
    comment = window.prompt("Comments: ");
    if(!rating || rating < 1 || rating > 5){
        console.log("cancelled");
        return 0
    }
    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"score": rating, "comment": comment})
    }

    fetch(`/api/fountains/${fountain_id}/ratings`, options)
        .then(response => response.json())
        .then(fountain => {
            console.log(fountain.average_rating);
            console.log(points[fountain_id]);
            points[fountain_id].setContent(updatePoint(fountain));
        })
        .catch(error => console.error('Failed to load fountains:', error));
}

map.on('popupopen', (ev) => {
    
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
            popup = L.popup().setContent(updatePoint(fountain));
            points[fountain.id] = popup;
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
            popup = L.popup().setContent(updatePoint(fountain));
            points[fountain.id] = popup;
            L.marker([fountain.lat, fountain.lng], {icon: fountain_icon})
                .addTo(map)
                .bindPopup(popup)
                .on('click', () => openSidebar(fountain.id));
        });
    })
    .catch(error => console.error('Failed to load fountains:', error));