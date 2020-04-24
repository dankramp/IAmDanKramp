"use strict;"
/**
 *** TODO ***
 *
 * Pagination with results (load 6 at a time until no more) 
 * Figure out how to handle longer descriptions
 * Once all tags/descriptions are done,
   * Sort all words and group similar ones together
   * Remove words to be omitted from search?
   * Add different forms of important words to search by
   * Map grouped words to root word
   * Map root word to (video, List[Type]) where Type: TAG|DESCRIPTOR
   * Score based on type (2 for descriptor, 1 for tag) and track matched tags
   * 
**/

const apiBaseUrl = "https://vxyje4h65f.execute-api.us-east-1.amazonaws.com/default";
const apiSearchUrl = apiBaseUrl + "/search";
const apiRatingUrl = apiBaseUrl + "/rate";
const cookiePrefix = "iadk-tytv-rating-"
const noRatingAvailableText = "No rating";
let searchString = '';
let videos = {};
let next_batch_num = 0;

async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'Content-Type': 'application/json'      
    },    
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return await response.json(); // parses JSON response into native JavaScript objects
}

function postRatingResponseHandler(res) {
	console.log(res);
	let rating_rext_comp = document.getElementById(res.video_id + "-rating-text");
	rating_rext_comp.innerHTML = " (" + res.rating.toFixed(1) + "/5)";
}

function starClickHandler(videoName, rating) {
	let oldRating = getCookieValue(cookiePrefix + videoName);
	let request = {
		video: videoName,
		rating: rating
	};
	if (oldRating == null) {
		request.mode = "NEW";
		console.log("First time rating!");
	} else {
		oldRating = parseInt(oldRating);
		request.mode = "UPDATE";
		request.old_rating = oldRating;
		console.log("Updating rating from " + oldRating + " to " + rating);
	}
	// Send request to lambda
	postData(apiRatingUrl, request).then(postRatingResponseHandler);
	// Update cookie
	document.cookie = cookiePrefix + videoName + "=" + rating + "; expires Fri, 31 Dec 9999 23:59:59 GMT"
	updateCardRating(videoName, rating);
}

function getCookieValue(key) {
	let cookieString = document.cookie;
	let index = cookieString.indexOf(key);
	if (index == -1) {
		return null;
	}
	let endIndex = cookieString.indexOf(";", index);
	if (endIndex == -1) endIndex = cookieString.length;
	let keyValue = cookieString.substring(index, endIndex);
	return keyValue.split("=")[1];
}

function updateCardRating(videoName, rating) {
	let video = videos[videoName];
	let newHtml = "";
	for (let i = 1; i < rating; i++) {
		newHtml += '<a href="javascript:starClickHandler(\'' + videoName + '\', ' + i + ')">' +
			'<i class="fa fa-star star-checked" id="' + videoName +'-star-' + i + '"></i></a>';
	}
	if (rating > 0)
		newHtml += '<i class="fa fa-star star-checked" id="' + videoName +'-star-' + rating + '"></i>';
	for (let i = rating + 1; i <= 5; i++) {
		newHtml += '<a href="javascript:starClickHandler(\'' + videoName + '\', ' + i + ')">' +
			'<i class="fa fa-star" id="' + videoName +'-star-' + i + '"></i></a>';	
	}
	let ratingDiv = document.getElementById(videoName + "-ratings");
	ratingDiv.innerHTML = newHtml;
}

function loadPage(initial=false) {
	// Check for query in GET request
	let query = window.location.search;
	let re = /query=([^&$]+)/;
	let search = query.match(re);
	if (search == null) {
		return;
	}

	// Configure search page
	if (initial) {
		searchString = decodeURIComponent(search[1].replace(/\+/g, '%20'));
		document.getElementById("tytube-logo-div").className = "col-md-2 tytube-logo-search";
		document.getElementById("search-input").value = searchString;
		document.getElementById("search-phrase").innerHTML = searchString;
		document.getElementById("search-container").classList.remove("d-none");
	}
	// Make request to APIG
	fetch(apiSearchUrl + query + "&batch_num=" + next_batch_num)
		.then(res => res.json())
		.then(responseHandler);
}

function responseHandler(res) {
	console.log(res);
	// Stop loading
	let video_results = res.videos;
	next_batch_num += 1;
	let results = document.getElementById("search-results");
	let newHtml = '';
	for (let i = 0; i < Math.floor((video_results.length + 2) / 3); i++) {
		newHtml += '<div class="row justify-content-center">';
		for (let j = 0; j < 3; j++) {
			let index = i * 3 + j;
			if (index < video_results.length) {
				let video = video_results[index];
				// Add to global map for later updates
				videos[video.title] = video;
				// Make matched words bold
				let descList = video.description.split(" ");
				// Replace this logic with regular expression that replaces s/[word]/<b>[word]</b>/g in description
				for (let w = 0, l = descList.length; w < l; w++) {
					let word = descList[w].toLowerCase();
					for (let s = 0, j = video.tags.length; s < j; s++) {
						if (word.includes(video.tags[s].toLowerCase())) {
							descList[w] = "<b>" + descList[w] + "</b>";
						}
					}
				}
				video.description = descList.join(" ");
				rating_text = "(" + noRatingAvailableText + ")";
				if (video.rating > 0) {
					rating_text = "(" + video.rating.toFixed(1) + "/5)";
				}

				let tagList = "";
				if (video.tags.length > 0) {
					tagList = '<small class="text-muted" style="text-overflow: ellipsis;">Matched tags: <b>' + video.tags.join(', ') + '</b></small>';
				}

				newHtml += '<div class="card col-sm-3 tytube-card">' +
					'<a class="link-no-style" href="' + video.url + '" target="_blank">' +
					'<img src="/images/tytv/' + video.title + '.jpg" class="card-img-top" alt="video-thumbnail"></a>' +
					'<div class="card-body pb-2">' +
					'<h5 class="card-title">' + video.title + '<small><i id="' + video.title + '-rating-text"> ' + rating_text + '</i></small></h5>' +
					'<div id="' + video.title + '-ratings"></div>' +
					'<p class="card-text">' + video.description + '</p></div><div class="px-2 py-1">' +
					tagList +
					'</div></div>';
			}
		}
		newHtml += "</div>";
	}
	document.getElementById("search-status").innerHTML = 'Displaying <b>' + Object.keys(videos).length + '</b> result(s) for <b>' + searchString + '</b>';
	if (res.videos_remaining) {
		document.getElementById("load-more-div").innerHTML = '<button class="btn btn-secondary" onclick="loadPage()">Load more</button>';
	} else {
		document.getElementById("load-more-div").innerHTML = '';
	}
	if (res.batch_num > 0) {
		results.innerHTML += newHtml;
	} else {
		results.innerHTML = newHtml;
	}
	for (let videoName in videos) {
		let rating = getCookieValue(cookiePrefix + videoName);
		if (rating == null) {
			rating = 0;
		} else {
			rating = parseInt(rating);
		}
		updateCardRating(videoName, rating);
	}
}


//*********************//
//** EXECUTION LOGIC **//
//*********************//

loadPage(true);