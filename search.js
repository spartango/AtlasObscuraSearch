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

function queryAtlasObscura(lat, lng, neLat, neLng, swLat, swLng, callback) {
    queryAtlasObscuraPage(lat, lng, neLat, neLng, swLat, swLng, 1, [], callback)
}

/** 
 * Execute queries against Atlas Obscura
 */
function queryAtlasObscuraPage(lat, lng, neLat, neLng, swLat, swLng, page, results, callback) {
	// Build query
	var queryString = '/search?q=&lat='+lat
					  +'&lng='+lng
					  +'&bounds%5Bne%5D%5B%5D='+neLat
					  +'&bounds%5Bne%5D%5B%5D='+neLng
					  +'&bounds%5Bsw%5D%5B%5D='+swLat
					  +'&bounds%5Bsw%5D%5B%5D='+swLng
                      +'&page='+page;

    // console.log(queryString);

	var options = {
	  hostname: 'www.atlasobscura.com',
	  port: 80,
	  path: queryString,
	  method: 'GET',
	  headers: {
	    'Accept': 'application/json',
	  }
	};

	// http request
	http.get(options, function(response) {
        var body = '';
        response.on('data', function(chunk) {
            body += chunk;
        });
        response.on('end', function() {
            var parsed = JSON.parse(body);
            var queryInfo   = parsed['query'];
            var pageResults = parsed['results'];

            // Append to results
            var newResults = results.concat(pageResults);

            // Check if additional pages necessary
            if(queryInfo['per_page'] * queryInfo['current_page'] < queryInfo['total_items']) {
                queryAtlasObscuraPage(lat, lng, neLat, neLng, swLat, swLng, page + 1, newResults, callback);
            } else {
                callback(newResults);
            }

        });
	}).on('error', function (e) {
		console.log("Error:" +e);
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
    var southern = (startLat  < endLat ? startLat : endLat);

    // Select eastern lng
    var eastern = (startLng >= endLng? startLng : endLng);
    var western = (startLng  < endLng? startLng : endLng);

    // Find center
    var centerLat = southern + ((northern - southern) / 2);
    var centerLng = eastern  + ((western - eastern)   / 2);

    queryAtlasObscura(centerLat, centerLng, northern, eastern, southern, western, callback);
}

/**
 * Search the area between two locations
 */
function searchAround(lat, lng, callback) {
	var latRange = 0.01;
	var lngRange = 0.02;
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

searchRoute(42.37, -71.05, 42.35, -71.07, function(response) {
    console.log(response.length + " results");
    console.log(JSON.stringify(response));
})