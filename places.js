var GooglePlaces = require('googleplaces');
var fs = require('fs');

var places = new GooglePlaces('APIKEY', 'json');

function searchAround(lat, lng, callback) {
    var query = {
        location: [lat, lng],
        radius: 50000, // meters
        types: "food|cafe|bar|grocery_or_supermarket|gas_station|liquor_store|night_club|restaurant|meal_takeaway"
    };

    places.placeSearch(query, function (error, response) {
        if (error) throw error;

        var results = response.results.map(function (result) {
            result['coordinates'] = result.geometry.location;
            return result;
        });
        callback(results);
    });
}

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
        fs.writeFile('city_gp.json', cityData);
        console.log("City places written");
    }
}

// - Test -
//searchAround(ourCities[0].lat, ourCities[0].lng, function (results) {
//    console.log(results);
//});

searchCities(ourCities.slice(0));
