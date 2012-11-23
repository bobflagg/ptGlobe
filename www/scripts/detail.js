function displayDetail(latitude, longitude, dataPath) {
	// Create the Google Map…
	var map = new google.maps.Map(d3.select("#map").node(), {
	  zoom: 8,
	  center: new google.maps.LatLng(latitude, longitude),
	  mapTypeId: google.maps.MapTypeId.TERRAIN
	});
};
displayDetail(37.76487, -122.41948, 'stations.json');      
