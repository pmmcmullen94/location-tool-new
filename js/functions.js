/// Default Values for heatmap
var googlefoodData = { max: 0, data: [] };
var googlecommunityData = { max: 0, data: [] };
var googlebigshopsData = { max: 0, data: [] };
var googlesmallshopsData = { max: 0, data: [] };
var googletransitData = { max: 0, data: [] };
var googletouristData = { max: 0, data: [] };

var yelpfoodData = { max: 0, data: [] };
var yelpshoppingData = { max: 0, data: [] };
var yelpcommunityData = { max: 0, data: [] };

var walkscoreData = { max: 0, data: [] };
var averageData = { max: 0, data: [] };
var compositeData = { max: 0, data: [] };
var markercontainer = [];

var layersactive = [];
var map;

//// Google Reverse Geocodeing Setup (for address display) ////
var geocoder = new google.maps.Geocoder;

function geocodeLatLng(geocoder, lat, lng) {
    var latlng = { lat: lat, lng: lng };
    geocoder.geocode({ 'location': latlng }, function (results, status) {
        if (status === 'OK') {
            if (results[1]) {
                document.getElementById('address').value = results[0].formatted_address;
            } else {
                document.getElementById('address').value = 'No results found';
            }
        } else {
            document.getElementById('address').value = 'Geocoder failed due to: ' + status;
        }
    });
}

/////////////// Base Map Setup /////////////////////////////
var baseLayer = L.tileLayer(
    'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }
);

//Event Listeners for Map Resizing and Initialization
google.maps.event.addDomListener(window, 'load', initializeMap);
google.maps.event.addDomListener(window, 'resize', function () {
    var center = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.panTo(center);    
});


var baseMaps = {
    "Map View": baseLayer
};

/// Marker customization, chnage iconUrl if you want a different looking marker ///

// var soofaIcon = L.icon({
//     iconUrl: iconimage in png format,

//     iconSize:     [38, 95], // size of the icon
//     shadowSize:   [50, 64], // size of the shadow
//     iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
//     shadowAnchor: [4, 62],  // the same for the shadow
//     popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
// });


/// Add Markers to Map on click, plus change scores when marker is dragged///

function onMapClick(e) {
    marker = new L.marker(e.latlng, { draggable: 'true' });
    marker.on('click', markerOnClick);
    markercontainer.push(marker);

    for (var name in AllScores) {        
        document.getElementById(name).value = calculatescore(marker.getLatLng().lat, marker.getLatLng().lng, AllScores[name]);
    }

    var currlocation = geocodeLatLng(geocoder, marker.getLatLng().lat, marker.getLatLng().lng);

    marker.addTo(map)
    map.panTo(marker.getLatLng());

    marker.on('dragend', function (event) {
        var marker = event.target;
        var position = marker.getLatLng();
        marker.setLatLng(new L.LatLng(position.lat, position.lng), { draggable: 'true' });
        var currlocation = geocodeLatLng(geocoder, marker.getLatLng().lat, marker.getLatLng().lng);
        marker.addTo(map)


        for (var name in AllScores) {
            document.getElementById(name).value = calculatescore(marker.getLatLng().lat, marker.getLatLng().lng, AllScores[name]);
        }

        var currlocation = geocodeLatLng(geocoder, marker.getLatLng().lat, marker.getLatLng().lng);


        map.panTo(new L.LatLng(position.lat, position.lng))

    });

    map.addLayer(marker);

};

/// Update scores on click ///
function markerOnClick(e) {
    for (var name in AllScores) {
        document.getElementById(name).value = calculatescore(e.latlng.lat, e.latlng.lng, AllScores[name]);
    }

    var currlocation = geocodeLatLng(geocoder, e.latlng.lat, e.latlng.lng);

    map.panTo(new L.LatLng(e.latlng.lat, e.latlng.lng));
}

//// Scoring Section ////

/// Get Scores of Closest Location ///
function closestscore(lat, lng, arr) {

    var bestlat = arr[0].lat;
    var bestlng = arr[0].lng;
    var bestdist = Math.pow(Math.abs(lat - bestlat), 2) + Math.pow(Math.abs(lng - bestlng), 2);
    var bestindex = 0;

    for (i = 1; i < arr.length; i++) {
        currlat = arr[i].lat;
        currlng = arr[i].lng;
        currdist = Math.pow(Math.abs(lat - currlat), 2) + Math.pow(Math.abs(lng - currlng), 2);
        if (currdist < bestdist) {
            bestlat = currlat;
            bestlng = currlng;
            bestindex = i;
            bestdist = currdist;
        }
    }
    return arr[bestindex].count
}

/// Return scores between 0 and 10 ///
function calculatescore(lat, lng, heatmapdata) {
    score = closestscore(lat, lng, heatmapdata.data);
    return Math.round(1000 * score / heatmapdata.max) / 100; // Returns two decimal places
}

//Code for changing cities, resets all values and markers
document.getElementById('selectcity').onchange = function () {
    
    /*TODO:
        would be better to just go search for this datafile and, if available, grab the needed element from it
        something like jquery.load to get the datafile, grab what is needed from it with .then() and push that data array to it's needed objects
    */

    var myScript = document.createElement('script');
    myScript.setAttribute('src', 'DataFiles/SoofaData' + this.value.split(" ")[0] + '.js');
    document.head.appendChild(myScript);
    myScript.onload = function () {
        compositelayer.setData({ max: 0, data: [] });
        document.getElementById("layerselector").reset();
        map.panTo(new L.LatLng(lat, lng));
        for (var i = 0; i < markercontainer.length; i++) {
            map.removeLayer(markercontainer[i]);
        };
        markercontainer = [];
        layersactive = [];
        map.removeLayer(rect);
        rect = L.rectangle([northeastcoord, southwestcoord], { dashArray: "10", color: "#4d4d4d", opacity: .8, fillOpacity: 0 });
        map.addLayer(rect);
        for (var name in AllScores) {
            document.getElementById(name).value = "";
        }
        document.getElementById('address').value = "";
    };

}

/// Function for adding multiple heatmaps together ///
function layertrigger(keyword) {
    var numSelected = $("#layerselector input:checked").not("#selectAllCheckBox").length;

    if (keyword == 'all') {
        var noneSelected = numSelected == 0;

        if (noneSelected) {
            //Set all to selected
            $("#layerselector input").prop('checked', true);
        }
        else {
            //Set all to not selected
            $("#layerselector input").prop('checked', false);
        }

        //recurse through allscores to trigger
        for (var name in AllScores) {
            if (name != 'average')
                layertrigger(name);
        }

        return;
    }    

    index = layersactive.indexOf(keyword);

    if (index > -1) {
        layersactive.splice(index, 1);
    } else {
        layersactive.push(keyword);
    }
    if (layersactive.length > 0) {
        var newdata = clone(AllScores[layersactive[0]].data);
        for (var j = 1; j < layersactive.length; j++) {
            var adder = clone(AllScores[layersactive[j]].data);
            for (var i = 0; i < newdata.length; i++) {
                newdata[i].count = newdata[i].count + adder[i].count;
            }
        }

        compositelayer.setData({ max: 1000, data: newdata });
    }

    else {
        compositelayer.setData({ max: 0, data: [] });
    }

    if (numSelected == (Object.keys(AllScores).length - 1)) {
        //All Selected, turn on select all
        $("#selectAllCheckBox").prop('checked', true);
    }
    else {
        $("#selectAllCheckBox").prop('checked', false);
    }    
}

/// Function to clone a javascript object ///
function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

/// Code for Searchbox adding marker ///
var searchBox = new google.maps.places.SearchBox(document.getElementById('mapsearch'));
google.maps.event.addListener(searchBox, 'places_changed', function () {

    for (var i = 0; i < searchBox.getPlaces().length; i++) {

        marker = new L.marker([searchBox.getPlaces()[i].geometry.location.lat(), searchBox.getPlaces()[i].geometry.location.lng()], { draggable: 'true' });
        marker.on('click', markerOnClick);          
        markercontainer.push(marker);

        for (var name in AllScores) {
            document.getElementById(name).value = calculatescore(marker.getLatLng().lat, marker.getLatLng().lng, AllScores[name]);
        }

        var currlocation = geocodeLatLng(geocoder, marker.getLatLng().lat, marker.getLatLng().lng);

        marker.addTo(map)
        map.panTo(marker.getLatLng());

        marker.on('dragend', function (event) {
            var marker = event.target;
            var position = marker.getLatLng();
            marker.setLatLng(new L.LatLng(position.lat, position.lng), { draggable: 'true' });
            var currlocation = geocodeLatLng(geocoder, marker.getLatLng().lat, marker.getLatLng().lng);
            marker.addTo(map)


            for (var name in AllScores) {
                document.getElementById(name).value = calculatescore(marker.getLatLng().lat, marker.getLatLng().lng, AllScores[name]);
            }

            document.getElementById('address').value = searchBox.getPlaces()[0].address;


            map.panTo(new L.LatLng(position.lat, position.lng))

        });
        map.addLayer(marker);
    }
});

/// Heatmap Specifications ///
/// If you want to have different colors, put this: gradient: {'.5': 'blue', '.8': 'red', '.95': 'white'}
var cfg1 = { "radius": .007, "maxOpacity": .8, "scaleRadius": true, "useLocalExtrema": true, latField: 'lat', lngField: 'lng', valueField: 'count', "blur": .8 };

var compositelayer = new HeatmapOverlay(cfg1);

/// Set Data ///
compositelayer.setData({ max: 0, data: [] });

// /// Create Map Layers ///
var compositegroup = L.layerGroup([compositelayer]);

// Code for Dashed Recntangle //
var rect = L.rectangle([northeastcoord, southwestcoord], { dashArray: "10", color: "#4d4d4d", opacity: .8, fillOpacity: 0 });

function initializeMap() {
    map = new L.Map(document.getElementById('map'), {
        center: new L.LatLng(42.3736, - 71.1097),
        zoom: 13,
        layers: [baseLayer]
    });    

    map.on('click', onMapClick);
    map.addLayer(compositegroup);
    map.addLayer(rect);
}

// Onclick outside of checkbox dropdown - closes if not a child of element or main element
$(document).click(function (e) {
    if (!$(e.target).closest("#collapseMenu").length) {
        $("#collapseMenu").collapse('hide');
    }
});