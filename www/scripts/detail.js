function displayDetail(latitude, longitude, dataPath) {
	// Create the Google Map…
	var map = new google.maps.Map(d3.select("#map").node(), {
	  zoom: 8,
	  center: new google.maps.LatLng(latitude, longitude),
	  mapTypeId: google.maps.MapTypeId.TERRAIN
	});
	// Load the city project data. When the data comes back, create an overlay.
	d3.json(dataPath, function(data) {
  		var overlay = new google.maps.OverlayView();
		// Add the container when the overlay is added to the map.
  		overlay.onAdd = function() {
    		var layer = d3.select(this.getPanes().overlayLayer).append("div").attr("class", "stations");
    		// Draw each marker as a separate SVG element.
    		// We could use a single SVG, but what size would it have?
    		overlay.draw = function() {
      			var projection = this.getProjection(), padding = 10;
      			var marker = layer.selectAll("svg").data(d3.entries(data))
          			.each(transform) // update existing markers
        			.enter().append("svg:svg")
          			.each(transform)
          			.attr("class", "marker");
				// Add a circle.
				//marker.append("svg:circle").attr("r", 4.5).attr("cx", padding).attr("cy", padding);
      			// Add a label.
      			//marker.append("svg:text").attr("x", padding + 7).attr("y", padding).attr("dy", ".31em")
          		//	.text(function(d) { return d.key; });
	      		function transform(d) {
	      			//var homeLatLng = new google.maps.LatLng(d.value[1], d.value[0]);
	      			console.log(d.value.longitude)
	      			var homeLatLng = new google.maps.LatLng(d.value.latitude, d.value.longitude);
					var marker = new MarkerWithLabel({
						position: homeLatLng,
						draggable: true,
						map: map,
						labelContent: "",
						labelAnchor: new google.maps.Point(22, 0),
						labelClass: "labels" // the CSS class for the label
					});
					var iw = new google.maps.InfoWindow({
						content: d.value.name.toString()
					});
					google.maps.event.addListener(marker, "click", function (e) { iw.open(map, marker); });


	        		d = new google.maps.LatLng(d.value.latitude, d.value.longitude);
	        		//d = new google.maps.LatLng(d.value[1], d.value[0]);
	        		//d = new google.maps.LatLng(d.value[1], d.value[0]);
	        		d = projection.fromLatLngToDivPixel(d);
	        		return d3.select(this)
	            		.style("left", (d.x - padding) + "px")
	            		.style("top", (d.y - padding) + "px");
      			}
    		};
  		};
  		// Bind our overlay to the map…
  		overlay.setMap(map);
	});
}
displayDetail(47.67399978637695, -122.12149810791016, 'data/Redmond-US.json');      
