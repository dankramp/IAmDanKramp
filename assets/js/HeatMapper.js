;(function (undefined) {
    "use strict;"

    // Public global variables
    var colors = [],
	scalar = [],
	self = undefined;

    /**
     * 
     *
     * Constructor for heatMapper object
     *
     *
     * @param {array} colorArray - contains the ordered sequence of colors from low
     *                             frequency to high. Colors are objects that have 'r', 'g',
     *                             and 'b' fields with values 0-255.
     * @param {number|array} scale - a number or array of numbers that denotes the scale
     *                               to which the heatmap will map color to frequency. 
     *
     *                               If a number, scale is linear mapping from 0 to the number.
     */

    var HeatMapper = function(colorArray, scale){
	
	self = this;

	/* Testing and correcting inputs */
	
	if (!colorArray.constructor === Array)
	    throw "error: colorArray must be an array.";

	// If scale is a Number, set it to an array with linearly
	// incrementing numbers from 0 to scale
	if (typeof(scale) === 'number') {
	    var scaleArray = [];
	    for (var i = 0, l = colorArray.length; i < l; i++) {
		scaleArray[i] = scale * i / (l - 1); 
	    }
	    scale = scaleArray;
	}
	if (!scale.constructor === Array )
	    throw "error: scale must be a number or an array.";
	if (scale.length != colorArray.length)
	    throw "error: scale array must be same length as color array";
	if (scale.length == 0)
	    throw "error: arrays must have at least one value";

	// Verify that numbers in scale are in order from least to greatest and no duplicates
	for (i = scale.length - 1; i >= 0; i--)
	    if (scale[i] <= scale[i - 1])
		throw "error: scale array must be ordered least to greatest without duplicates.";

	// Verify that colors have r, g, b fields that are [0,255]
	for (i = 0, l = colorArray.length; i < l; i++)
	    colorArray[i] = validateAndNormalizeColor(colorArray[i]);

	// All tests passed; create object
	colors = colorArray;
	scalar = scale;
    }


    /**
     * Calculates the color at the given value using either linear or logistic interpolation
     *
     * @param {number} value - The value at which to calculate the color
     * @param {boolean} log  - True if logistic interpolation; false or empty if linear
     *
     * @returns {string} The calculated color as a string in hex format; e.g. '#ff04de'
     */
    HeatMapper.prototype.getHexColor = function(value, log) {
	
	if (value <= scalar[0]) // Beneath lower bound
	    return colors[0];
	else if (value >= scalar[scalar.length - 1]) // Above upper bound
	    return colors[colors.length - 1];

	else {
	    for (var i = 1, l = scalar.length; i < l; i++) {
		if (value < scalar[i]) { // Value is between scalar[i] and scalar[i-1]
		    var vect = (log) ? 1 / (1 + Math.pow(Math.E, -10 / (scalar[i] - scalar[i - 1]) * (value - (scalar[i] + scalar[i - 1] ) / 2))) : // Log
			(value - scalar[i - 1]) / (scalar[i] - scalar[i - 1]); // Linear
		    
		    var c1 = hexToRGB(colors[i-1]),
			c2 = hexToRGB(colors[i]);
		    return rgbToHex({r: vect * (c2.r - c1.r) + c1.r,
				     g: vect * (c2.g - c1.g) + c1.g,
				     b: vect * (c2.b - c1.b) + c1.b });
		}
		else if (value == scalar[i]) // Value is on scalar, return color
		    return colors[i];
	    }
	}
	
    }
    
    /*
     * Internal function: Converts hexadecimal string to RGB object
     */
    function hexToRGB(hex) {	
	return {r: parseInt(hex.substring(1, 3), 16),
		g: parseInt(hex.substring(3, 5), 16),
		b: parseInt(hex.substring(5, 7), 16) };
    }

    /*
     * Internal function: Converts rgb object to hexadecimal string
     */
    function rgbToHex(rgb) {
	var r = Math.floor(rgb.r).toString(16),
	    g = Math.floor(rgb.g).toString(16),
	    b = Math.floor(rgb.b).toString(16);

	r = (r.length > 1) ? r : "0" + r;
	g = (g.length > 1) ? g : "0" + g;
	b = (b.length > 1) ? b : "0" + b;

	return "#" + r + g + b;
    }

    /*
     * Internal function: Validates color format with regex then normalizes to #rrggbb
     */
    function validateAndNormalizeColor(color) {
	// Validate
	var regex = new RegExp("^#([a-fA-F0-9]{3}){1,2}$");
	if (!regex.test(color)) {
	    throw "error: colors must be formatted as #rrggbb or #rgb";
	}
	// Normalize to six-digit hex
	regex = new RegExp("^#[a-fA-F0-9]{3}$");
	if (regex.test(color)) { // three character hex
	    color = "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
	}
	return color;
    }
    
    this.HeatMapper = HeatMapper;
    
}).call(this);
