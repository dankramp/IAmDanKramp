var canvas,
canvas_div,
ctx,
height,
width,
grabbedPoint,
mousePos,
gravitate,
random_weight,
pl,
el,
spring_length,
edge_grid,
points,
edges;

document.body.onload = function() {
	canvas = document.getElementById("the-canvas");
	canvas_div = document.getElementById("canvas-div");

		// Event listeners
	canvas.addEventListener("mousedown", mouseDown);
	canvas.addEventListener("mouseup", mouseUp);
	canvas.addEventListener("mousemove", setMousePos);
	canvas.addEventListener("touchstart", mouseDown);
	canvas.addEventListener("touchend", mouseUp);
	canvas.addEventListener("touchmove", setMousePos);
	window.addEventListener("resize", windowResize);

	ctx = canvas.getContext("2d");
	width = canvas.width;
	height = canvas.height;

	grabbedPoint = undefined;
	mousePos = {"x": 0, "y": 0};

	pl = 20; // # of points
	el = 50; // # of edges
	spring_length = 80;

	create(null);
};
function setMousePos(e) {
	if (e.type == "mousedown" || e.type == "mousemove") {
		mousePos = {"x": e.offsetX, "y": e.offsetY};
	} else {
		e.preventDefault();
		var rect = canvas.getBoundingClientRect();
		mousePos = {"x": e.touches[0].clientX - rect.left, "y": e.touches[0].clientY - rect.top};		
	}
}
function mouseDown(e) {
	setMousePos(e);
	if (grabbedPoint == undefined) {
		for (var i = 0; i < pl; i++) {
			if (Math.sqrt(Math.pow(mousePos.x - points[i].x, 2) + Math.pow(mousePos.y- points[i].y, 2)) < points[i].weight / 2) {
				grabbedPoint = i;
				break;
			}
		}
	}
}
function mouseUp(e) {
	grabbedPoint = undefined;
}
function windowResize(e) {
	width = canvas.width = canvas_div.offsetWidth;
	height = canvas.height = document.getElementById("settings-menu").offsetHeight;
}
function create(e) {
	var p = document.getElementById("inputNumPoints").value;
	var e = document.getElementById("inputNumEdges").value;
	gravitate = document.getElementById("checkGravitate").checked;
	spring_length = document.getElementById("inputSpringLength").value;
	random_weight = document.getElementById("checkWeight").checked;
	init(p, e);
}
function init(numPoints, numEdges) {
	windowResize();

	pl = numPoints; // # of points
	el = Math.min(numEdges, (pl - 1) * pl / 2); // # of edges - cannot be more than total possible edges
	document.getElementById("inputNumEdges").value = el;
	points = [];
	edges = [];

	// Square grid of size pl that contains connection information
	edge_grid = [];
	var i, j;
	for (i = 0; i < pl; i++) {
		edge_grid[i] = [];
		for (j = 0; j < pl; j++) {
			edge_grid[i].push(i == j);
		}
	}

	// Add edges
	for (i = 0; i < el; i++) {
		var i_src = Math.floor(Math.random() * pl),
		i_trg = Math.floor(Math.random() * pl),
		src = (i_src + 1) % pl,
		trg = (i_trg + 1) % pl;
		// No repeated edges -- search grid
		while (edge_grid[src][trg]) {
			trg++;
			if (trg == pl) { // End of row
				trg = 0;
				src = (src+1) % pl;
			} 
		}
		edges.push({
			"source": src,
			"target": trg
		});
		edge_grid[src][trg] = true;
		edge_grid[trg][src] = true;
	}
	
	// Add points
	for (i = 0; i < pl; i++) {				
		points.push({
			"x": Math.floor(Math.random() * width),
			"y": Math.floor(Math.random() * height),
			"weight": random_weight ? Math.floor(Math.random() * 15 + 4) : 10
		});
	}
	window.clearInterval();
	window.setInterval(draw, 20);
}
function springUpdate() {
	var k = 500;
	var forces = [];
	
	var i;
	for (i = 0; i < pl; i++) {
		forces[i] = {"x": 0, "y": 0};
	}
	// Gravity to center
	for (i = 0; i < pl; i++) {
		var a = points[i];
		var center = {"x": width / 2, "y": height / 2};
		var distance = Math.sqrt(Math.pow(a.x - center.x, 2) + Math.pow(a.y - center.y, 2));
		var angle = Math.atan2(center.y - a.y, center.x - a.x);
		var force = distance / 100;
		forces[i].x += force * Math.cos(angle);
		forces[i].y += force * Math.sin(angle);					
		if (gravitate) { // gravitate to mouse
			center = mousePos;
			distance = Math.sqrt(Math.pow(a.x - center.x, 2) + Math.pow(a.y - center.y, 2));
			angle = Math.atan2(center.y - a.y, center.x - a.x);
			force = distance > 50 ? 250 / distance : distance / 4;
			forces[i].x += force * Math.cos(angle);
			forces[i].y += force * Math.sin(angle);
		}
	}
	// Edges
	for (i = 0; i < el; i++) {
		var edge = edges[i];
		var a = points[edge.source];
		var b = points[edge.target];
		if (a == b) {
			continue;
		}
		var distance = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
		var angle = Math.atan2(b.y - a.y, b.x - a.x);
		// Attractive force
		var force = -k * distance / (spring_length * spring_length);
		var totalWeight = a.weight + b.weight;
		forces[edge.source].x -= force * Math.cos(angle) * b.weight / totalWeight;
		forces[edge.source].y -= force * Math.sin(angle) * b.weight / totalWeight;
		forces[edge.target].x += force * Math.cos(angle) * a.weight / totalWeight;
		forces[edge.target].y += force * Math.sin(angle) * a.weight / totalWeight;
	}
	for (i = 0; i < pl; i++) {
		var a = points[i];
		for (j = i + 1; j < pl; j++) {
			var b = points[j];
			var distance = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
			var angle = Math.atan2(b.y - a.y, b.x - a.x);
			// Repulsive forces
			var force = k * spring_length / (distance * distance);
			var totalWeight = a.weight + b.weight;
			forces[i].x -= force * Math.cos(angle) * b.weight / totalWeight;
			forces[i].y -= force * Math.sin(angle) * b.weight / totalWeight;
			forces[j].x += force * Math.cos(angle) * a.weight / totalWeight;
			forces[j].y += force * Math.sin(angle) * a.weight / totalWeight;
		}
	}
	for (i = 0, l = forces.length; i < l; i++) {
		points[i].x += forces[i].x;
		points[i].y += forces[i].y;
	}
	if (grabbedPoint != undefined) {
		points[grabbedPoint].x = mousePos.x;
		points[grabbedPoint].y = mousePos.y;
	}
}

function draw() {
	springUpdate();

	ctx.fillStyle = "#00F";
	ctx.strokeStyle = "#00F";
	ctx.lineWidth = 1;

	ctx.clearRect(0, 0, width, height);
	// Edges first
	var i, l;
	ctx.beginPath();
	for (i = 0; i < el; i++) {
		ctx.moveTo(points[edges[i].source].x, points[edges[i].source].y);
		ctx.lineTo(points[edges[i].target].x, points[edges[i].target].y);
	}
	ctx.stroke();

	// Points
	for (i = 0; i < pl; i++) {
		ctx.beginPath();
		ctx.arc(points[i].x, points[i].y, points[i].weight / 2, 0, 2 * Math.PI, true);
		ctx.fill();
	}
}