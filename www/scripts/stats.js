function displayStats() {
	//console.log("dataPath: "+dataPath);
	var width = 400,
		height = 380,
	    format = d3.format(",d"),
	    color = d3.scale.category20c();
	var bubble = d3.layout.pack()
	    .sort(null)
	    .size([width, height])
	    .padding(1.5);
	var svg = d3.select("#stats-wrapper").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("class", "bubble");
	d3.json("data/topic-counts.json", function(root) {
	  	var node = svg.selectAll(".node")
			//.data(bubble.nodes(classes(root))
			.data(bubble.nodes(root).filter(function(d) { return !d.children; }))
			.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

		node.append("title")
			.text(function(d) { return d.name + ": " + format(d.value); });

		node.append("circle")
			.attr("r", function(d) { return d.r; })
			.style("fill", function(d) { return color(d.name); });

		node.append("text")
			.attr("dy", ".3em")
			.style("text-anchor", "middle")
			.text(function(d) { return d.name.substring(0, d.r / 3); });
	});
	// Returns a flattened hierarchy containing all leaf nodes under the root.
	function classes(root) {
		var classes = [];

		function recurse(name, node) {
			if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
			else classes.push({packageName: name, className: node.name, value: node.size});
		}

		recurse(null, root);
		return {children: classes};
	}

	d3.select(self.frameElement).style("height", height + "px");
}
