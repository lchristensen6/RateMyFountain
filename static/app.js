// Initialize the map, centered roughly on your area (adjust these coordinates)
const map = L.map('map')
// .setView([40.7829, -73.9654], 13); Starting area, clean up after
map.locate({ setView: true, maxZoom: 40 });

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

let currentEventHandler = {};
function addEventListenerWrapper(type, func, obj, id){
    console.log(currentEventHandler[id])
    if(currentEventHandler[id]) {
        obj.removeEventListener(type, currentEventHandler[id]);
    }
    currentEventHandler[id] = func

    obj.addEventListener(type, currentEventHandler[id]);
}
function submitComment(event, fountain){
    event.preventDefault();
    const formData = new FormData(event.target);
    const comment = formData.get('comment');
    // const rating = parseInt(formData.get('rating'));
    const rating = parseInt(document.querySelector('.active').dataset.value)
    rateFountain(fountain.id, rating, comment);
}

function fillInStar(stars, num){
    stars.forEach(current_star => {
        if (parseInt(current_star.dataset.value) <= num){
            current_star.innerHTML = "&starf;"
            current_star.classList.remove("active")
        }else{
            current_star.innerHTML = "&star;"
            current_star.classList.remove("active")
        }
    });
}

function starClicked(event, stars, star){
    fillInStar(stars, star.dataset.value)

    star.classList.add("active")


}
function openSidebar(fountain){
    map.flyTo([fountain.lat, fountain.lng]);
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('open');

    const closeButton = document.getElementById('closeSidebar');
    const commentForm = document.getElementById('commentForm');
    const stars = document.querySelectorAll('.star');


    commentForm.reset()
    fillInStar(stars, 0)
    stars.forEach(star => {
        addEventListenerWrapper('click', (event) => starClicked(event, stars, star), star, "starclick")
    });
    
    addEventListenerWrapper('submit', (event) => submitComment(event, fountain), commentForm, "submitbutton");
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