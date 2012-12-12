// Globals.  I know, I know!
var circle, loaded = false, path, projection, resume, stopRotating = false, svg;
var sampleCity = d3.select("#sample-city");

//map.attr("visibility", "hidden");
// Define movement functions in advance of drawing SVG
var m0, o0;
function mousedown() {
  m0 = [d3.event.pageX, d3.event.pageY];
  o0 = projection.origin();
  d3.event.preventDefault();
}
function mousemove() {
  if (m0) {
    stopRotating = true;
    resume.attr("class", "resume-stopped");
    var m1 = [d3.event.pageX, d3.event.pageY],
        o1 = [o0[0] + (m0[0] - m1[0]) / 8, o0[1] + (m1[1] - m0[1]) / 8];
    projection.origin(o1);
    circle.origin(o1);
    refresh();
  }
}
function mouseup() {
  if (m0) {
    mousemove();
    m0 = null;
  }
}
function showGlobe() {
    var windowDim = 300;
    var voffset = 8;
    var offset = 40;
    var paddingDim = 10;
    var origin = [-71.03, 25.37];
    console.log(windowDim/2 + paddingDim/2);
    projection = d3.geo.azimuthal()
        .scale(windowDim/2) // scale factor, defaults to 200
        .origin(origin)
        .mode("orthographic")
        .translate([(windowDim/2 + paddingDim/2 + offset), (windowDim/2 + paddingDim/2 + voffset)]); // 25 pixel margin

    // generates a circle for clipping features before converting to paths
    circle = d3.geo.circle().origin(projection.origin());
    // Generates path function() for creating svg paths
    path = d3.geo.path().projection(projection);
    svg = d3.select("#globe").append("svg:svg")
        .attr("width", (windowDim + paddingDim + offset))
        .attr("height", (windowDim + paddingDim + voffset))
        .on("mousedown", mousedown);

    // Now add a border circle
    var backgroundCircle = svg.selectAll("circle").data([0]).enter().append('circle')
        .attr("class", "globe-outline")
        .attr("fill-opacity", 0.0) // Override these with css for globe-outline
        .attr("stroke", "#000000") // Override these with css for globe-outline
        .attr("r", (windowDim+4)/2) // Add a 2 pixel buffer
        .attr("cx", ((windowDim+paddingDim)/2 + offset))
        .attr("cy", ((windowDim+paddingDim)/2 + voffset));
    // Load the GEOJSON data for the countries
    d3.json("data/worldcountries.geo.json", function(collection) {
        feature = svg.selectAll("path")
            .data(collection.features)
            .enter()
            .append("svg:path")
            .attr("class", "country")
            .attr("d", clip);
        feature.append("svg:title")
            .text(function(d) { return d.properties.name; });
        spin();
    });
    // Add the "resume" rotation text
    resume = d3.select("#resume");
    resume.attr("class", "resume-playing").on("click", function() {
        if (stopRotating) {
            stopRotating = false;
            resume.attr("class", "resume-playing");
            spin();
        } else {
            resume.attr("class", "resume-stopped");
            stopRotating = true;
        }
    });
    // Then allow the window to get moved around
    d3.select(window).on("mousemove", mousemove).on("mouseup", mouseup);
}
function clip(d) {
  return path(circle.clip(d));
}
function pointSize(mag) {
    if (mag <= 2) return 2;
    if (mag <= 5) return 3;
    if (mag <= 10) return 4
    if (mag <= 20) return 5
    if (mag <= 50) return 6
    if (mag <= 100) return 7
    return 8;
}
function spin() {
    var velocity = [0.0040, 0.0000];
    t0 = Date.now();
    origin = projection.origin();
    d3.timer(function() {
        var t = Date.now() - t0;
        // Don't refresh until everything is rendered... ah ha
        if (t > 500 && loaded) {
            var o = [origin[0] + (t - 500) * velocity[0], origin[1] + (t - 500) * velocity[1]];
            projection.origin(o);
            circle.origin(o);
            refresh();
        }
        return stopRotating;
    });
}
function refresh(duration) {
    function updateCity(d) {
        var coords = [];
        clipped = circle.clip(d);
        if (clipped) {
            coords[0] = projection(clipped.geometry.coordinates)[0];
            coords[1] = projection(clipped.geometry.coordinates)[1];
            coords[2] = 1;
        } else {
            coords[0] = projection(d.geometry.coordinates)[0];
            coords[1] = projection(d.geometry.coordinates)[1];
            coords[2] = 0;
        }
        return coords;
    }
    points = svg.selectAll(".city");  
    if (points) {
        points.attr({
            "cx": function(d) {
                return updateCity(d)[0];
            },
            "cy": function(d) {
                return updateCity(d)[1];
            },
            "r": function(d) {
                if (updateCity(d)[2] === 1) {
                    return pointSize(d.properties.numProjects);
                } else {
                    return 0;
                }
            }
        });
    }
    (duration ? feature.transition().duration(duration) : feature).attr("d", clip);
}
function addCities(topics) {
    d3.json("data/cities.json", function(cities) {
        var features = cities.features;
        if (topics) {
            features = features.filter(function(d) { 
                for (var i=0;i<topics.length;i++) {
                    if (d.properties.topics.indexOf(topics[i]) > -1) return true;
                }
                return false;
            });
        }
        points = svg.selectAll(".city");     
        points.data(features).enter()
            .append("svg:circle")
            .on("click", function(d) {
                // display the map
                $("#map-wrapper").slideDown();
                $("#map-wrapper").css("visibility","visible");
                $("#globe-wrapper").slideUp();
                displayDetail(d.geometry.coordinates[1], d.geometry.coordinates[0], 'data/city/'+
                    d.properties.city.toString()+"-"+
                    d.properties.country.toString()+
                    '.json');      
                element = d3.select(this);
                element.attr("fill", "#000000")
                .attr("stroke-width", 2);

                var numSites = d.properties.numSites;
                if (numSites == 1) numSites = "one development site"
                else numSites =  numSites+" development sites"
                var numProjects = d.properties.numProjects;
                if (numProjects == 1) numProjects = "one project"
                else numProjects =  numProjects+" projects"
                var text = d.properties.city+": "+numSites+"; "+numProjects+".";  
                text += " Click on a site tag for details."   
                sampleCity.text(text);
            })                
            .attr("class", "city")
            .attr("cx", function(d) {
                return projection(d.geometry.coordinates)[0];
            })
            .attr("cy", function(d) {
                return projection(d.geometry.coordinates)[1];
            })
            .append("svg:title").text(function(d) { 
                var numSites = d.properties.numSites;
                if (numSites == 1) numSites = "one development site"
                else numSites =  numSites+" development sites"
                var numProjects = d.properties.numProjects;
                if (numProjects == 1) numProjects = "one project"
                else numProjects =  numProjects+" projects"
                var text = d.properties.city+": "+numSites+"; "+numProjects+".";  
                text += " Click on the city for details."          
                return text;       
            });
        if (stopRotating) {
            points.transition()
                .duration(500)
                .attr("r", function(d) {
                    return pointSize(d.properties.numProjects);
                });
            refresh();
        } else {
            points.attr("r", function(d) {
                return pointSize(d.properties.numProjects);
            });
        }
        loaded = true;
    });
}
function removeCities() {
    svg.selectAll(".city").remove();   
}
