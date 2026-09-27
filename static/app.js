// Initialize the map, centered roughly on your area (adjust these coordinates)
const map = L.map('map').setView([40.7829, -73.9654], 13);

points = {};

function updatePoint(fountain){
    return "";
}

function updateSidebar(fountain){
    const sidebarTitle = document.querySelector('.sidebartitle');
    const sidebartext = document.querySelector('.sidebartext');
    fetch(`/api/fountains/${fountain.id}`)
    .then(response => response.json())
    .then(list => {
        sidebarTitle.textContent = `${fountain.name}`;
        sidebartext.innerHTML = Object.values(list)
        .map(item => `<li>Rating: ${item.score ? item.score : ""} ${item.comment ? ", Comment: " + item.comment : ""}</li>`)
        .join("") 
    })
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

let currentEventHandler = null;
function addEventListenerWrapper(type, func, obj){
    if(currentEventHandler) {
        obj.removeEventListener(type, currentEventHandler);
    }
    currentEventHandler = func;

    obj.addEventListener(type, currentEventHandler);
}
function submitComment(event, fountain){
    event.preventDefault();
    console.log("Comment Form: " + fountain.id);
    const formData = new FormData(event.target);
    const comment = formData.get('comment');
    const rating = parseInt(formData.get('rating'));
    rateFountain(fountain.id, rating, comment);
}
function openSidebar(fountain){
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('open');

    const closeButton = document.getElementById('closeSidebar');
    const commentForm = document.getElementById('commentForm');
    // commentForm.addEventListener('submit', (event) => submitComment(event, fountain), {once: true});
    addEventListenerWrapper('submit', (event) => submitComment(event, fountain), commentForm);
    updateSidebar(fountain);
    
    closeButton.addEventListener('click', () => sidebar.classList.remove('open'));
    

}
function rateFountain(fountain_id, rating, comment){
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
            updateSidebar(fountain);
        })
        .catch(error => console.error('Failed to load fountains:', error));
}


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
                // .bindPopup(popup)
                .on('click', () => openSidebar(fountain));
        });
    })
    .catch(error => console.error('Failed to load fountains:', error));