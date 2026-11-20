// Creates the map
const map = L.map('map').setView([40.252166, -111.643902], 5); 
// Asks the browser for the visitor's location. If they
// allow it, the map centers and zooms there.
map.locate({ setView: true, maxZoom: 20 });

// Adds a small distance scale bar to the bottom-left of the map.
L.control.scale({
    position: 'bottomleft',
    metric: true,       // Show kilometres/metres
    imperial: true      // Show miles/feet
}).addTo(map);

// Adds the map tiles to the website with maz zoom set.
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 20
}).addTo(map);

// Replaces the default marker icon with a picture of a person drinking from a water fountain, image in images/fountain.png
var fountain_icon = L.icon({
    iconUrl: iconUrl,
    iconSize:     [38, 45], // Width and height in pixels of icon
    iconAnchor:   [16,0], // Spot of icon that correspond to the fountain's coordinates.
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});


// Add a marker for each fountain from the database on startup.
fetch('/api/fountains')
    .then(response => response.json())
    .then(fountains => {
        fountains.forEach(fountain => {
            // Create a marker with the custom fountain icon and add it to the map. Adds event handler 
            // on click that runs openSidebar on the given fountain.
            L.marker([fountain.lat, fountain.lng], {icon: fountain_icon})
                .addTo(map)
                .on('click', () => openSidebar(fountain));
        });
    })
    .catch(error => console.error('Failed to load fountains:', error));

// Function that stores all of the event listeners currently being used.
let currentEventHandler = {};
// Wrapper function for addEventListener that allows you to separate event handler's 
// by id, and let's you replace the event listener with the same id. This is needed
// to update the form in the sidebar to the specific fountain, rather than having 
// all previously clicked fountains linked at once.
function addEventListenerWrapper(type, func, obj, id){
    // If an old handler is remembered for this id, take it off the element first.
    if(currentEventHandler[id]) {
        obj.removeEventListener(type, currentEventHandler[id]);
    }
    // Remember the new handler, then attach it.
    currentEventHandler[id] = func
    
    obj.addEventListener(type, currentEventHandler[id]);
}

// Given a fountain, asks the server for that fountain's reviews and shows them in
// the sidebar.
function updateSidebar(fountain){
    const sidebarTitle = document.getElementById('fountainName');
    const sidebartext = document.getElementById('commentsList');
    // Sends a request to pull the fountain data from the databse
    fetch(`/api/fountains/${fountain.id}`)
    .then(response => response.json())
    .then(list => {
        //Sets the title of the sidebar to the fountain name.
        sidebarTitle.textContent = `${fountain.name}`;
        // Replaces the sidebar text with all of the reviews from the fountain.
        sidebartext.innerHTML = Object.values(list)
        .map(item => `<li>Rating: ${item.score ? item.score : ""} ${item.comment ? ", Comment: " + item.comment : ""}</li>`)
        .join("") 
    })
}

// Runs when a fountain marker is clicked. It slides the map so the fountain
// stays visible next to the sidebar, opens the panel, resets the form, connects the stars and the
// submit button, and loads the reviews.
function openSidebar(fountain){
    const sidebar = document.querySelector('.sidebar');
    const closeButton = document.getElementById('closeSidebar');
    const ratingForm = document.getElementById('ratingForm');
    const stars = document.querySelectorAll('.star');

    // Calculates the distance to focus the center of the map when clicking a marker, so as to not block the 
    // marker with the sidebar.
    let map_distance = Math.abs((map.getBounds().getSouthWest().lng - map.getBounds().getSouthEast().lng));
    let map_distance_pixels = Math.abs((map.getPixelBounds().getBottomLeft().x - map.getPixelBounds().getBottomRight().x) / 2);

    // Convert the sidebar's width from pixels into degrees of longitude (its share of the screen
    // width, times the longitude span of the map).
    sidebar_length = ((sidebar.offsetWidth / 2)/ map_distance_pixels) * map_distance

    // centers the map to the new spot relative to the fountains location.
    map.flyTo([fountain.lat, fountain.lng - (sidebar_length / 2)], map.getZoom(), {animate : true, duration : 1.0} );

    // Opens the sidebar
    sidebar.classList.add('open');


    // Clear anything typed in the form last time, and reset the stars to all-empty.
    ratingForm.reset()
    fillInStar(stars, 0)
    // Make each star clickable. The wrapper removes the previous click handler (if any) before
    // adding a new one.
    stars.forEach(star => {
        addEventListenerWrapper('click', (event) => starClicked(event, stars, star), star, "starclick")
    });
    
    addEventListenerWrapper('submit', (event) => submitComment(event, fountain), ratingForm, "submitbutton");

    updateSidebar(fountain);
    closeButton.addEventListener('click', () => sidebar.classList.remove('open'));
    

}
// Runs when the review form is submitted.
function submitComment(event, fountain){
    // Stops the browser from reloading the page.
    event.preventDefault();
    // Reads the data from the submitted form
    const formData = new FormData(event.target);
    // Get the text from the comment box
    const comment = formData.get('commentInput');
    
    //Rating between 1-5 from the selected star
    const rating = parseInt(document.querySelector('.active').dataset.value)

    rateFountain(fountain.id, rating, comment);
}

// Sends the rating to the database
function rateFountain(fountain_id, rating, comment){
    // Validates the rating
    if(!rating || rating < 1 || rating > 5){
        console.log("cancelled");
        return 0
    }
    //Posts the data as a json with the body being the rating and comment
    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"score": rating, "comment": comment})
    }

    // Sends the rating to the database as a POST request
    fetch(`/api/fountains/${fountain_id}/ratings`, options)
        .then(response => response.json())
        .then(fountain => {
            updateSidebar(fountain);
        })
        .catch(error => console.error('Failed to load fountains:', error));
}


function fillInStar(stars, num){
    // forEach runs the function once for every star in the list.
    stars.forEach(current_star => {
        // Fills in all of the stars underneath the selected rating value.
        if (parseInt(current_star.dataset.value) <= num){
            current_star.innerHTML = "&starf;"
            current_star.classList.remove("active")
        }else{
            current_star.innerHTML = "&star;"
            current_star.classList.remove("active")
        }
    });
}

// Fill in every star up to that one, then mark the clicked star as
// active
function starClicked(event, stars, star){
    fillInStar(stars, star.dataset.value)

    star.classList.add("active")


}


//On click adds a fountain to that location
map.on('click', function(ev) {
    // Location of click
    let lat = ev.latlng.lat;
    let lng = ev.latlng.lng;
    // Prompts for name of fountain
    let answer = window.prompt("Name of Water Fountain: ");

    // If the answer is empty or cancel is pressed then stop
    if(!answer || answer == ""){
        console.log("cancelled")
        return null
    }

    // posts a request with the name, lat and lng of the new fountain
    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"name": answer, "lat": lat, "lng": lng})

    }
    // Sends a post request to create a new fountain at the given spot
    fetch('/api/fountains', options)
        .then(response => response.json())
        .then(fountain => { 
            // Create the marker at the fountain's coordinates, add it to the map, and attach the
            // popup to it.
            L.marker([fountain.lat, fountain.lng])
                .addTo(map)
        })
        .catch(error => console.error("Uh oh", error))

});