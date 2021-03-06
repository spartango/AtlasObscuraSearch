/* 
 Test query system
 curl -H "Accept: application/json" http://www.atlasobscura.com/search\?q\=\&lat\=42.36\&lng\=-71.06\&bounds%5Bne%5D%5B%5D\=42.37\&bounds%5Bne%5D%5B%5D\=-71.05\&bounds%5Bsw%5D%5B%5D\=42.35\&bounds%5Bsw%5D%5B%5D\=-71.07\&page\=1\&source\=desktop
 */

// - Query - 
// http://www.atlasobscura.com/search - base url
// ?q= - query
// &lat=42.36  - center lat
// &lng=-71.06 - center long
// &bounds%5Bne%5D%5B%5D=42.37  - NE corner lat
// &bounds%5Bne%5D%5B%5D=-71.05 - NE corner long 
// &bounds%5Bsw%5D%5B%5D=42.35  - SW corner lat
// &bounds%5Bsw%5D%5B%5D=-71.07 - SW corner long
// &page=1&source=desktop

var http = require('http');
var fs = require('fs');

function queryAtlasObscura(lat, lng, neLat, neLng, swLat, swLng, callback) {
    queryAtlasObscuraPage(lat, lng, neLat, neLng, swLat, swLng, 1, [], callback)
}

/**
 * Execute queries against Atlas Obscura
 */
function queryAtlasObscuraPage(lat, lng, neLat, neLng, swLat, swLng, page, results, callback) {
    // Build query
    var queryString = '/search?q=&lat=' + lat
        + '&lng=' + lng
        + '&bounds%5Bne%5D%5B%5D=' + neLat
        + '&bounds%5Bne%5D%5B%5D=' + neLng
        + '&bounds%5Bsw%5D%5B%5D=' + swLat
        + '&bounds%5Bsw%5D%5B%5D=' + swLng
        + '&page=' + page;

    // console.log(queryString);

    var options = {
        hostname: 'www.atlasobscura.com',
        port: 80,
        path: queryString,
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    };

    // http request
    http.get(options, function (response) {
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            var parsed = JSON.parse(body);
            var queryInfo = parsed['query'];
            var pageResults = parsed['results'];
            var cleanedResults = pageResults.map(function (result) {
                return result['result'];
            });
            // Append to results
            var newResults = results.concat(cleanedResults);

            // Check if additional pages necessary
            if (queryInfo['per_page'] * queryInfo['current_page'] < queryInfo['total_items']) {
                queryAtlasObscuraPage(lat, lng, neLat, neLng, swLat, swLng, page + 1, newResults, callback);
            } else {
                callback(newResults);
            }

        });
    }).on('error', function (e) {
        console.log("Error:" + e);
        callback(results);
    });
}

/**
 * Search the area between two locations
 */
function searchRoute(startLat, startLng, endLat, endLng, callback) {
    // Define bounding box
    // Select northern lat
    var northern = (startLat >= endLat ? startLat : endLat);
    var southern = (startLat < endLat ? startLat : endLat);

    // Select eastern lng
    var eastern = (startLng >= endLng ? startLng : endLng);
    var western = (startLng < endLng ? startLng : endLng);

    // Find center
    var centerLat = southern + ((northern - southern) / 2);
    var centerLng = eastern + ((western - eastern) / 2);

    queryAtlasObscura(centerLat, centerLng, northern, eastern, southern, western, callback);
}

/**
 * Search the area between two locations
 */
function searchAround(lat, lng, callback) {
    var latRange = 1;
    var lngRange = 1;
    queryAtlasObscura(lat,
        lng,
        lat + latRange, // NE
        lng + lngRange, // NE
        lat - latRange, // SW
        lng - lngRange, // SW
        callback);
}

// - Test - 
// queryAtlasObscura(42.36, -71.06, 42.37, -71.05, 42.35, -71.07, function(response) {
// 	console.log(response);
// });

// searchAround(42.36, -71.06, function(response) {
//     console.log(JSON.stringify(response));
// })

// searchRoute(42.37, -71.05, 42.35, -71.07, function(response) {
//     console.log(response.length + " results");
//     console.log(JSON.stringify(response));
// })

// - Run -
var ourCities = [
    {name: "Boston, MA", lng: -71.058880, lat: 42.360082},
    {name: "Providence, RI", lng: -71.389160, lat: 41.795888},
    {name: "New York, NY", lng: -74.005941, lat: 40.712784},
    {name: "Philadelphia, PA", lng: -75.165222, lat: 39.952584},
    {name: "Washington, DC", lng: -77.036871, lat: 38.907192},
    {name: "Norfolk, VA", lng: -76.285873, lat: 36.850769},
    {name: "Wilmington, NC", lng: -77.944710, lat: 34.225726},
    {name: "Charleston, SC", lng: -79.947510, lat: 32.768800},
    {name: "Jacksonville, FL", lng: -81.672363, lat: 30.334954},
    {name: "Atlanta, GA", lng: -84.385986, lat: 33.751748},
    {name: "Nashville, TN", lng: -86.781602, lat: 36.162664},
    {name: "Terre Haute, IN", lng: -87.413909, lat: 39.466703},
    {name: "Chicago, IL", lng: -87.629798, lat: 41.878114}
];

var cityPlaces = {};

function searchCities(cities) {
    if (cities.length > 0) {
        var city = cities.pop();
        searchAround(city['lat'], city['lng'], function (results) {
            cityPlaces[city['name']] = results;
            searchCities(cities);
        });
    } else {
        var cityData = JSON.stringify(cityPlaces, null, 4);
        fs.writeFile('city_ao.json', cityData);
        console.log("City places written");
    }
}

var legPlaces = {};

function searchLegs(cities) {
    if (cities.length > 1) {
        var nextCity = cities.pop();
        var city = cities[cities.length - 1];
        searchRoute(city['lat'],
            city['lng'],
            nextCity['lat'],
            nextCity['lng'],
            function (results) {
                legPlaces[city['name'] + ' to ' + nextCity['name']] = results;
                searchLegs(cities);
            });
    } else {
        var legData = JSON.stringify(legPlaces, null, 4);
        fs.writeFile('leg_ao.json', legData);
        console.log("Leg places written");
    }
}

searchCities(ourCities.slice(0));
searchLegs(ourCities.slice(0));