var topics = [];
var topicHash = new Hash();
topicHash["Book Layout"] = 1;
topicHash["Typography"] = 2;
topicHash["Web Design"] = 3;
topicHash["Illustration"] = 4;
topicHash["Information graphics"] = 5;
topicHash["Interfaces"] = 6;
topicHash["Crafts"] = 7;
topicHash["Pen & Ink"] = 8;
topicHash["Dry Media"] = 9;
topicHash["Installation"] = 10;
topicHash["Multi-media"] = 11;
topicHash["Painting"] = 12;
topicHash["Sculpture"] = 13;
topicHash["Nutrition & Fitness"] = 14;
topicHash["Medical Imaging"] = 15;
topicHash["Personal Data Tracking"] = 16;
topicHash["Therapeutic Machines"] = 17;
topicHash["Hardware"] = 18;
topicHash["Software"] = 19;
topicHash["Sensors"] = 20;
topicHash["Circuitry"] = 21;
topicHash["Energy & Sustainability"] = 22;
topicHash["Chemistry"] = 23;
topicHash["Astronomy"] = 24;
topicHash["Genetics"] = 25;
var stateChanged = true;
var m = [0, 120, 0, 70],
    w = 500 - m[1] - m[3],
    h = 500 - m[0] - m[2],
    i = 0,
    root;

var tree = d3.layout.tree()
    .size([h, w]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var vis = d3.select("#topics-wrapper").append("svg:svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
    .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");


d3.json("data/topics.json", function(json) {
  root = json;
  root.x0 = h / 2;
  root.y0 = 0;
  resetSelections();
  d3.select("#dap")      
    .style("cursor", "pointer")
    .on("click", function() {resetSelections(); updateGlobe();});
});

function updateGlobe() {
  removeCities(); 
  collectAllTopics();
  addCities(topics);
  stateChanged = false;
}
function resetState(d) {
  d.state = false
  if (d.children) {
    d.children.forEach(resetState);
  }
  if (d._children) {
    d._children.forEach(resetState);
  }
}
function assignParents(d) {
  if (d.children) {
    d.children.forEach(function(c) { c.parent = d; assignParents(c);});
  }
}

function resetSelections() {
  function toggleAll(d) {
    if (d.children) {
      d.children.forEach(toggleAll);
      toggle(d);
    }
  }
  // Initialize the display to show a few nodes.
  root.children.forEach(toggleAll);
  toggle(root.children[0]);
  toggle(root.children[1]);
  toggle(root.children[4]);
  toggle(root.children[0].children[0]);
  toggle(root.children[1].children[1]);
  resetState(root);
  root.state = true;
  root.parent = null;
  assignParents(root);
  update(root);
}

function collectAllTopics() {
  topics = [];
  collectTopics(root, root.state);
}

function collectTopics(d, state) {
  if (d.children) {
    d.children.forEach(function(node) {collectTopics(node,state || d.state)});
  } else if (d._children) {
    d._children.forEach(function(node) {collectTopics(node,state || d.state)});
  } else {
    if (d.state || state) {
      topics.push(topicHash[d.name])
    }
  }
}

function update(source) {
  var duration = d3.event && d3.event.altKey ? 5000 : 500;

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse();

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 90; });
  //nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes…
  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", function(d) { toggle(d); update(d); });
  nodeEnter.append("svg:circle")
    .attr("r", 1e-6)
    .style("fill", function(d) { return d.state ? "red" : "lightsteelblue"; });

  nodeEnter.append("svg:text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.name; })
      .attr("fill", function(d) { return d.state ? "red" : "grey"; })
      .attr("font-family", "FuturaStd-Medium")
      .style("fill-opacity", 1e-6)
      .style("cursor", "pointer")
      .on("click", function(d) { 
        d3.event.stopPropagation();
        toggleState(d);
        update(d);
        d3.event.preventDefault();
      });

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", 5)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
      //.style("stroke", function(d) { return d.state ? "red" : "lightsteelblue"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1)
      .attr("fill", function(d) { return d.state ? "red" : "grey"; })

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = vis.selectAll("path.link")
      .data(tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
    .transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });

  if (stateChanged) {
    updateGlobe();
  }
}

// Toggle children.
function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}

function toggleState(d) {
  stateChanged = true;
  if (d.state) {
    d.state = false;
  } else {
    d.state = true;
    // deselect parent states...
    deselectDecendents(d);
    if (d.parent) deselectAncestors(d.parent);
  }
}

function deselectAncestors(d) {
  d.state = false
  if (d.parent) deselectAncestors(d.parent);
}

function deselectDecendents(d) {
  if (d.children) {
    d.children.forEach(function(c) { c.state = false; deselectDecendents(c);});
  }
  if (d._children) {
    d._children.forEach(function(c) { c.state = false; deselectDecendents(c);});
  }
}
