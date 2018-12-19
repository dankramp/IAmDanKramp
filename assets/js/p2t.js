var imageUrlInput,
resolutionInput,
resolution,
img,
imageDiv,
imageWarning,
fileInputLabel,
pre;
document.body.onload = function() {
	img = document.getElementById("image-dom");
	img.addEventListener("error", badImageFile);	
	imageDiv = document.getElementById("image-preview");
	imageWarning = document.getElementById("image-invalid");
	pre = document.getElementById("generated-text-pre");
	resolutionInput = document.getElementById("resolution-input");
	resolution = 5;
	resolutionInput.addEventListener("change", updateResolution);
	resolutionInput.addEventListener("input", updateResolution);
	fileInputLabel = document.getElementById("file-input-label");
	// Check if HTML5 support
	if (!(window.File && window.FileReader && window.FileList && window.Blob)) { 
		// No file upload; paste base 64 instead
		document.getElementById("html5-div").style = "display: none;";
		document.getElementById("non-html5-div").style = "";
		imageUrlInput = document.getElementById("imgUrlInput");
		imageUrlInput.addEventListener("blur", function() {
			imageDiv.classList.remove("invisible");
			imageWarning.style = "display: none;";
			img.src = imageUrlInput.value;
		});
	} else {
		document.getElementById("file-input").addEventListener("change", handleFileSelect);
	}

};

function updateResolution(e) {
	resolution = 9 - resolutionInput.value;
	document.getElementById("resolution-label").innerHTML = "Resolution [" + resolutionInput.value + "]";
}

function badImageFile() {
	imageDiv.classList.add("invisible");
	imageWarning.style = "";
}

function handleFileSelect(e) {
	// Get only first file
	var file = e.target.files[0];
	fileInputLabel.innerHTML = file.name;
	var reader = new FileReader();

	// Show image preview
	reader.onload = function(e) {
		var result = e.target.result;
		imageDiv.classList.remove("invisible");
		imageWarning.style = "display: none;";
		img.src = result;
	}

  	// Read in the image file as a data URL.
  	reader.readAsDataURL(file);
  }

  function copyText() {
  	const temp = document.createElement('textarea');
  	temp.value = pre.innerHTML;
  	document.body.appendChild(temp);
  	temp.select();
  	document.execCommand('copy');
  	document.body.removeChild(temp);
  }

  function convertToText() {
  	var data = getImageArrayData();

  	const NUM_BYTES = 4;

  	var output = "";
  	var i, j, li, lj, px, py, i_offset, j_offset, px_offset, base_offset;
  	for (i = 0, li = img.height / resolution; i < li; i++) {
  		i_offset = i * img.width * resolution;
  		var max_row = (i + 1 < li) ? resolution : img.height - i * resolution;
  		for (j = 0, lj = img.width / resolution; j < lj; j++) {
  			j_offset = j * resolution;
  			var max_col = (j + 1 < lj) ? resolution : img.width - j * resolution;
  			var avgValue = 0;
			for (px = 0; px < max_row; px++) { // pixel x
				px_offset = px * img.width;
				for (py = 0; py < max_col; py++) { // pixel y
					base_offset = (i_offset + j_offset + px_offset + py) * NUM_BYTES;			
					var totalValue = data[base_offset + 0]; // red
					totalValue += data[base_offset + 1]; // green
					totalValue += data[base_offset + 2]; // blue
					//totalValue *= data[base_offset + 3]; // alpha not yet supported
					avgValue += totalValue / 3;
				}
			}
			avgValue /= (max_row * max_col);
			output += getCharacterForValue(avgValue);
		}
		output += "\n";
	}

	// Add text to pre element
	pre.innerHTML = output;
	pre.style = "font-size: 5px; line-height: 1.2em;";
	// Add copy text button
	document.getElementById("copy-btn").disabled = "";
}

function getCharacterForValue(value) {
	/*
	const ramp = "$@B%8&WM#oawmZO0JUYXzcvjft/|()1[]?-_+~i;:,^`'. ";
	const length = ramp.length;
	var character = ramp[Math.floor(value / 255.0 * length)]
	return character + character;
	*/
	if (value < 25) {		
		return "@@";
	} else if (value < 35) {
		return "BB";
	} else if (value < 55) {
		return "00";
	} else if (value < 100) {
		return "11";
	} else if (value < 160) {
		return "::";
	} else if (value < 200) {
		return "..";
	} else {
		return "  ";
	}
}

function getImageArrayData() {
	var canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, img.width, img.height);
	return ctx.getImageData(0, 0, img.width, img.height).data;
}