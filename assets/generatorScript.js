"use strict;"

// DOM Elements
var canvas = document.getElementById("heatCanvas"),
    ctx = canvas.getContext("2d"),
    list = document.getElementById("input-list"),
    val_input = document.getElementById("get-value"),
    log_check = document.getElementById("log-check"),
    
    // Event booleans
    mouseDown = false,
    rightMouseDown = false,
    mouseDragging = false,
    
    // HeatMapper variables
    heatmap = undefined,
    scalar = [],
    colors = [],
    detail = 100,
    breakPoint = undefined;

// Event Listeners
canvas.addEventListener("mousedown", mouseDownHandler);
canvas.addEventListener("contextmenu", rightMouseHandler);
canvas.addEventListener("mousemove", mouseMoveHandler);
canvas.addEventListener("mouseup", mouseUpHandler);
val_input.addEventListener("input", valueChangeHandler);
log_check.addEventListener("click", function() {
    updateMap();
    valueChangeHandler(null);
    document.getElementById("code-2").innerHTML = (log_check.checked) ? ", true) = " : ") = ";
});

function valueChangeHandler(event) {
    document.getElementById("hex-value").innerHTML = heatmap.getHexColor(val_input.value * 10, log_check.checked);
}

function mouseDownHandler(event) {
    mouseDown = event.which == 1;
}

function rightMouseHandler(event) {
    event.preventDefault();
    var nearest = nearestBreak(event.offsetX);
    if (~nearest && scalar.length != 1) {
	scalar.splice(nearest, 1);
	colors.splice(nearest, 1);
	updateMap();
	updateCode();
	updateList();
    }
}

function mouseMoveHandler(event) {
    mouseDragging = mouseDown;
    if (mouseDragging) {
	if (breakPoint == undefined) {
	    breakPoint = nearestBreak(event.offsetX);
	}
	if (~breakPoint) {
	    scalar[breakPoint] = event.offsetX - event.offsetX % (canvas.width / detail);
	    updateMap();
	    updateCode();
	}
    }
}

function mouseUpHandler(event) {
    breakPoint = undefined;

    if (mouseDown && !mouseDragging) {
	var nearest = nearestBreak(event.offsetX);
	
	if (~nearest) { // If a break is found
	    document.getElementById("sp" + nearest).click();
	}
	else {
	    var scalar_value = event.offsetX - event.offsetX % (canvas.width / detail),
		i = 0,
		l = scalar.length;
	    for (; i < l; i++) {
		if (scalar[i] > scalar_value)
		    break;
	    }
	    scalar.splice(i, 0, scalar_value);
	    colors.splice(i, 0, "#ff0000");
	    updateMap();
	    updateList();
	    updateCode();
	}
    }
    mouseDragging = false;
    mouseDown = false;
}

function updateCode() {
    document.getElementById("code-box").innerHTML = "// Auto-generated code will appear here\n\n\
var colors = [" + colors.map(function(c){ return "'" + c + "'";}).join(",") + "];\n\
var scale = [" + scalar.map(function(s){ return s / 10; }).join(",") + "];\n\
var heatmap = new HeatMapper(colors, scale);";
}

function getComplementaryColor(color) {
    var value = 16777215 - parseInt(color.substring(1), 16);
    return "#" + value.toString(16).padStart(6, '0');
}

function updateMap() {
    heatmap = new HeatMapper(colors, scalar);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < detail; i++) {
	ctx.fillStyle = heatmap.getHexColor(i * canvas.width / detail, log_check.checked);
	ctx.fillRect(i * canvas.width / detail, 0, canvas.width / detail, canvas.height);
    }

    var rectSize = Math.max(Math.floor(canvas.width / detail), 6);
    for (var i = 0, l = scalar.length; i < l; i++) {
	ctx.beginPath();
	ctx.strokeStyle = getComplementaryColor(colors[i]);
	ctx.strokeRect(scalar[i] - scalar[i] % (rectSize) + .5, 0, rectSize, canvas.height);
    }
}

function updateList() {
    for (i = 0, l = list.childNodes.length; i < l; i++) {
	document.getElementById("sp" + i).removeEventListener("input", changeColor);	 
    }
    list.innerHTML = "";
    for (var i = 0, l = scalar.length; i < l; i++) {
	list.innerHTML += "<li hidden>" + scalar[i] +
	    "<input type='color' id='sp" + i + "' value='" + colors[i] + "'></li>";
    }
    for (i = 0, l = scalar.length; i < l; i++) {
	document.getElementById("sp" + i).addEventListener("input", changeColor);	 
    }
}

function changeColor(event) {    
    colors[parseInt(event.srcElement.id.substring(2))] = event.srcElement.value;
    updateMap();
    updateCode();
}

function nearestBreak(x) {
    if (scalar.length == 0)
	return -1;
    
    var i,
	l;
    for (i = 0, l = scalar.length; i < l; i++)
	if (x - x % (canvas.width / detail) == scalar[i])
	    return i;

    return -1;
}
