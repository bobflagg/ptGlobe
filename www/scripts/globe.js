// Based on Mike Bostock's example at: http://mbostock.github.com/d3/talk/20111018/azimuthal.html
var circle, feature, loaded = false, path, points, projection, stopRotating = false, svg;
var pointScale = d3.scale.linear();
var startColor = "#E6D97D";
var endColor = "#C93131";
var highlightColor = "#46422C";
var colorScale = d3.scale.linear().domain([0, 10]).range([startColor, endColor]);
function pointSize(count) {
    d = pointScale(count)
    return (8.0 * Math.sqrt(d / Math.PI));
}
function cityColors(d) {
    return d3.rgb(colorScale(pointScale(d))).darker(0.0).toString();
}
function cityOpacity(d) {
    return (1 - (1 - pointScale(d) * 0.1) / 2);
}
function clearCities() {
    if (points) {
        points.transition().duration(500).attr("r",0).remove();
        //points.attr("r",0).remove();
    }
    refresh();
}
function delayedRefresh(duration) {
    // give time for things to be rendered...
    t0 = Date.now();
    console.log("delaying...");
    d3.timer(function() {
        var done = false;
        var t = Date.now() - t0;
        // Don't refresh until everything is rendered... ah ha
        if (t > 500 || done) {
            refresh(duration);
            done = true;
        }
        return done;
    });
}
function refresh(duration) {
    function updateCity(d) {
        var coords = [];
        clipped = circle.clip(d);
        if (clipped !== null) {
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

    if (duration) {
        feature.transition().duration(duration).attr("d", clip);
        if (points) {
            points.transition().duration(duration).attr({
                "cx": function(d) {
                    return updateCity(d)[0];
                },
                "cy": function(d) {
                    return updateCity(d)[1];
                },
                "r": function(d) {
                    if (updateCity(d)[2] === 1) {
                        return pointScale(d.properties.mag);
                    } else {
                        return 0;
                    }
                }
            });
        }
    } else {
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
                        return 2*pointScale(d.properties.mag);
                    } else {
                        return 0;
                    }
                }
            });
        }
    }
    if (points) feature.attr("d", clip);

}
// Clips the feature according to the great circle, then converts it to a both
function clip(d) {
  return path(circle.clip(d));
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
function addCities(topics) {
    if (!topics) topics = [];
    // Define sample city widgets:
    var cityText = d3.select("#current-city");
    var cityLink = d3.select("#current-city-link");
    var sampleCity = d3.select("#sample-city");
    var loadTime = d3.select("#load-time");
    // Add the blank city outline
    var citiesSVG = sampleCity.append("svg").attr("width", 50).attr("height", 50);
    citiesSVG.selectAll("sample-city").data([0]).enter().append("circle")
        .attr("r", 10)
        .attr("cx", 25)
        .attr("cy", 25)
        .attr("fill", "#C9C9C9")
        .attr("class", "sample-city");
    // Finally update the data load time
    var currentDate = new Date();
    var format = d3.time.format("%A %B %e, %Y at %H:%M local time."); //  at %H:%M:%S
    loadTime.text(format(currentDate));
    // And spin the globe
    d3.json("data/cities.json", function(cities) {
        //cities = cities.filter(function(d) { return true;});
        features = cities.features;
        features = features.filter(function(d) { 
            for (var i=0;i<topics.length;i++) {
                if (d.properties.topics.indexOf(topics[i]) > -1 ) return true;
            }
            return false;
        });
        var maxCount = d3.max(features, function(d) { return d.properties.mag;})
        pointScale.range([1,8])
        pointScale.domain([1, maxCount])
        points = svg.selectAll("points").data(features)        
        points.enter()
            .append("svg:circle")
            .on("mouseover", function(d) {
                // First unhighlight the rest of the points
                points.attr("class", "city");
                element = d3.select(this);
                element.attr("class", "city-selected");
                cityText
                  .attr("href", d.properties.url)
                  .attr("class", "city-text")
                  .text(d.properties.mag.toString() + " projects in " +
                    d.properties.city.toString()+", "+d.properties.region.toString()+" ("+
                    d.properties.country.toString()+")");
                cityLink
                  .attr('href', d.properties.url)
                  .text("  (Link)  ");
                var demoCity = citiesSVG.selectAll("circle");
                demoCity
                  .attr("stroke", highlightColor)
                  .attr("r", pointSize(d.properties.mag))
                  .attr("opacity", cityOpacity(d.properties.mag))
                  .attr("fill", cityColors(d.properties.mag));
                displayDetail(d.geometry.coordinates[1], d.geometry.coordinates[0], 'data/'+
                    d.properties.city.toString()+"-"+
                    d.properties.region.toString()+"-"+
                    d.properties.country.toString()+
                    '.json');      
            })
            .attr("class", "city")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1)
            .attr("fill", function(d) {
                return cityColors(d.properties.mag);
            })
            .attr("cx", function(d) {
                return projection(d.geometry.coordinates)[0];
            })
            .attr("cy", function(d) {
                return projection(d.geometry.coordinates)[1];
            })
            .attr("r", function(d) {
                return pointSize(d.properties.mag);
            });
        //points.exit().remove();
        loaded = true;
    });
}

function showGlobe() {
    var windowDim = 400;
    var paddingDim = 40;
    var debug = true;
    // Define origin and get ready to roll
    var origin = [-71.03, 25.37];
    projection = d3.geo.azimuthal()
        .scale(windowDim/2) // scale factor, defaults to 200
        .origin(origin)
        .mode("orthographic")
        .translate([(windowDim/2 + paddingDim/2), (windowDim/2 + paddingDim/2)]); // 25 pixel margin
    // generates a circle for clipping features before converting to paths
    circle = d3.geo.circle().origin(projection.origin());
    // Generates path function() for creating svg paths
    path = d3.geo.path().projection(projection);
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
    // Now draw the globe
    svg = d3.select("#globe").append("svg:svg")
        .attr("width", (windowDim + paddingDim))
        .attr("height", (windowDim + paddingDim))
        .on("mousedown", mousedown);
    // Now add a border circle
    svg.selectAll("circle").data([0]).enter().append('circle')
        .attr("class", "globe-outline")
        .attr("fill-opacity", 0.0) // Override these with css for globe-outline
        .attr("stroke", "#000000") // Override these with css for globe-outline
        .attr("r", (windowDim+4)/2) // Add a 2 pixel buffer
        .attr("cx", ((windowDim+paddingDim)/2))
        .attr("cy", ((windowDim+paddingDim)/2));
    // Load the GEOJSON data for the countries
    d3.json("data/worldcountries.geo.json", function(collection) {
        feature = svg.selectAll("path").data(collection.features).enter()
            .append("svg:path")
            .attr("class", "country")
            .attr("d", clip);
        //addCities();
        //loaded = true;
        //refresh();
        spin();
    });
    // Add the "resume" rotation text
    var resume = d3.select("#resume");
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
