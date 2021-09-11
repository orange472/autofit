(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**Things to add:
 * Allow user to add body part sliders to the popup.html
 * Figure out how to have extension run even if another tab is opened
 */

chrome.runtime.onInstalled.addListener(function (details) {
	try {
		// ADD MEASUREMENTS HERE, MEASUREMENTS MUST BE UPDATED IN ALL RELEVANT FILES
		chrome.storage.sync.set({
			men: {
				shoulders: 0,
				chest: 0,
				waist: 0,
				hip: 0,
				legs: 0,
				height: 0,
			},
			women: {
				shoulders: 0,
				chest: 0,
			},
			kids: {
				legs: 0,
			},
			sizeCharts: {},
			openers: [],
			settings: {
				open: false,
			},
		});
		console.log(
			"%cSuccessfully added 'measurements: []' to Chrome storage",
			"padding: 1px 4px; color: #fff; background-color: #001f66; border-radius: 4px;"
		);
	} catch (err) {
		console.log(
			"%cFailed to add 'measurements: []' to Chrome storage",
			"padding: 1px 4px; color: #d6410b; background-color: #333333; border-radius: 4px;"
		);
		console.log("Error: " + err);
	}
});

// MESSAGE LISTENERS
var currentBestSize = "";

chrome.runtime.onMessage.addListener(function (req, sender, send) {
	if (req.type == "tab") {
		const getCurrentTab = async () => {
			let props = { active: true, currentWindow: true };
			let tab = new Promise((resolve, reject) => {
				try {
					chrome.tabs.query(props, (tabs) => {
						resolve(tabs);
					});
				} catch (error) {
					reject(new Error("Failed to retrieve tabs."));
				}
			});

			return await tab;
		};

		getCurrentTab().then((res) => {
			send(res);
		});
	}

	if (req.type == "open") {
		chrome.storage.sync.get(["openers"], (res) => {
			const openers = res.openers,
				origin = req.origin,
				id = req.id;

			openers.push({
				[origin]: id,
				keys: req.keys,
				userType: req.userType,
			});

			console.log(`Window was opened from ${origin}`);
			chrome.storage.sync.set({ openers: openers });
			send(true);
		});
	}

	if (req.type == "close") {
		chrome.storage.sync.get(["openers"], (res) => {
			const openers = res.openers,
				origin = req.origin,
				open = openers.some((pair) => {
					if (origin in pair) {
						var index = openers.indexOf(pair);
						openers.splice(index, 1);
						return true;
					}
				});

			chrome.storage.sync.set({ openers: openers });
			if (open) {
				send(true);
			} else {
				send(false);
			}
		});
	}

	if (req.type == "resolve") {
		console.log("Running analytics");
		resolve(req.sizeChart, req.tab, req.id, req.keys, req.userType);

		function resolve(sizeChart, tab, id, keys, userType) {
			const isVertical = keys.some((key) => {
				return sizeChart[0].some((cell) => {
					if (cell.toLowerCase().includes(key)) {
						return true;
					}
				});
			});

			var sortedChart = {};

			if (isVertical) {
				for (var row = 1; row < sizeChart.length; row++) {
					var size = sizeChart[row][0];
					sortedChart[size] = {};

					for (var col = 1; col < sizeChart[row].length; col++) {
						var measurement = sizeChart[0][col];
						sortedChart[size][measurement] = sizeChart[row][col];
					}
				}
			} else {
				for (var col = 1; col < sizeChart[0].length; col++) {
					var size = sizeChart[0][col];
					sortedChart[size] = {};

					for (var row = 1; row < sizeChart.length; row++) {
						var measurement = sizeChart[row][0];
						sortedChart[size][measurement] = sizeChart[row][col];
					}
				}
			}

			console.log("Input: %o", sizeChart);

			chrome.storage.sync.get([`${userType}`], (res) => {
				const userMeasurements = res[userType];
				var bestSize = "";
				var bestScore = 0;
				var score = 0;

				Object.keys(sortedChart).forEach((size) => {
					// e.g. small: {chest: "1.618-3.141"}
					var totalPoints = 0;
					var count = 0;
					console.groupCollapsed(size);

					Object.keys(userMeasurements).forEach((measurementName) => {
						//e.g. chest: 2
						Object.keys(sortedChart[size]).forEach((data) => {
							// e.g. chest: "1.618-3.141"
							if (data.toLowerCase().includes(measurementName)) {
								var pageData = sortedChart[size][data].replace(
										" ",
										""
									),
									userData =
										userMeasurements[measurementName],
									targetNum = parseInt(userData);

								if (userData <= 0) {
									console.log(
										`User's value is invalid for ${measurementName}!`
									);
									return;
								} else {
									totalPoints += 100;
									count++;
								}

								if (pageData.includes("-")) {
									var indexOfDash = pageData.indexOf("-"),
										lowerNum = parseFloat(
											pageData.substring(0, indexOfDash)
										),
										upperNum = parseFloat(
											pageData.substring(
												indexOfDash + 1,
												pageData.length + 1
											)
										);

									if (targetNum < lowerNum) {
										totalPoints -=
											(100 * (lowerNum - targetNum)) /
											targetNum;
									} else if (targetNum > upperNum) {
										totalPoints -=
											(100 * (targetNum - upperNum)) /
											targetNum;
									}
									console.groupCollapsed(measurementName);
									console.log(`user: ${targetNum}`);
									console.log(`lower: ${lowerNum}`);
									console.log(`upper: ${upperNum}`);
									console.groupEnd();
								} else {
									var givenNum = parseFloat(pageData);
									totalPoints -=
										(100 * (targetNum - givenNum)) /
										targetNum;
									console.groupCollapsed(measurementName);
									console.log(`user: ${targetNum}`);
									console.log(`given: ${givenNum}`);
									console.groupEnd();
								}
							}
						});
					});

					score = totalPoints / count;
					if (score > bestScore) {
						bestScore = score;
						bestSize = size;
					}

					console.groupCollapsed("results");
					console.log(`Total points: ${totalPoints}`);
					console.log(`Matched body parts: ${count}`);
					console.log(`Score: ${score}`);
					console.groupEnd();
					console.groupEnd();
				});

				currentBestSize = bestSize;
				console.log(bestSize);
				chrome.tabs.sendMessage(req.id, {
					type: "iframe",
				});
			});
		}
	}

	if (req.type == "getBestSize") {
		send(currentBestSize);
	}

	return true;
});

console.log(
	"%cBackground working!",
	"padding: 1px 4px; color: #000000; background-color: #8fabeb; border-radius: 4px;"
);

},{}]},{},[1]);
