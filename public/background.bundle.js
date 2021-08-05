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
				open: true,
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
			const openers = res.openers;
			const origin = req.origin;
			const id = req.id;

			openers.push({ [origin]: id, keys: req.keys, userType: req.userType });

			console.log(`Window was opened from ${origin}`);
			chrome.storage.sync.set({ openers: openers });
			send(true);
		});
	}

	if (req.type == "close") {
		chrome.storage.sync.get(["openers"], (res) => {
			const openers = res.openers;
			const origin = req.origin;

			const open = openers.some((pair) => {
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
		console.log("Resolved, running analytics with the following data...");
		console.log(req);
		resolve(req.sizeChart, req.tab, req.id, req.keys);

		function resolve(sizeChart, tab, id, keys) {
			const determineOrientation = () => {
				// if true, then keys (chest, waist, hip, etc.) are on top
				// if false, then sizes (small, medium, large, etc.) are on top
				return keys.some((key) => {
					return sizeChart[0].some((cell) => {
						if (cell.toLowerCase().includes(key)) {
							return true;
						}
					});
				});
			};

			const sortChart = () => {
				var output = {};

				if (determineOrientation()) {
					for (var row = 1; row < sizeChart.length; row++) {
						var size = sizeChart[row][0];
						output[size] = {};

						for (var col = 1; col < sizeChart[row].length; col++) {
							var measurement = sizeChart[0][col];
							output[size][measurement] = sizeChart[row][col];
						}
					}
				} else {
					for (var col = 1; col < sizeChart[0].length; col++) {
						var size = sizeChart[0][col];
						output[size] = {};

						for (var row = 1; row < sizeChart.length; row++) {
							var measurement = sizeChart[row][0];
							output[size][measurement] = sizeChart[row][col];
						}
					}
				}

				return output;
			};

			const findBestMatch = () => {
				const chart = sortChart();
				const userType = req.userType;
				console.log(chart);

				chrome.storage.sync.get([`${userType}`], (res) => {
					const userMeasurements = res[userType];
					var bestSize = "";
					var score = 0;

					Object.keys(chart).forEach((size) => {
						var totalPoints = 0;
						var count = 0;

						Object.keys(userMeasurements).forEach((measurementName) => {
							Object.keys(chart[size]).forEach((data) => {
								var matched = data.toLowerCase().includes(measurementName);

								if (matched) {
									var pageData = chart[size][data].replace(" ", "");
									var userData = userMeasurements[measurementName];
									var targetNum = parseInt(userData);

									if (pageData.includes("-")) {
										var indexOfDash = pageData.indexOf("-");
										var lowerNum = pageData.substring(0, indexOfDash);
										var upperNum = pageData.substring(
											indexOfDash + 1,
											pageData.length + 1
										);

										lowerNum = parseInt(lowerNum);
										upperNum = parseInt(upperNum);

										if (targetNum >= lowerNum && targetNum <= upperNum) {
											totalPoints += 100;
										}

										console.log(
											`%cMeasurement name: ${measurementName}, user: ${targetNum}, lowerNum: ${lowerNum}, upperNum: ${upperNum}`,
											"background: #6782bf; color: #fff; padding: 1px 4px; border-radius: 4px;"
										);
									}

									count++;
								}
							});
						});

						if (totalPoints / count > score) {
							score = totalPoints / count;
							bestSize = size;
						}

						console.log(
							`%cTotal points: ${totalPoints}, Matched body parts: ${count}, Score: ${
								totalPoints / count
							}`,
							"color: #097d28;"
						);
					});

					console.log(bestSize);
				});
			};

			const compare = (user, chart) => {
				console.log("compare");
			};

			findBestMatch();
		}

		chrome.tabs.sendMessage(req.id, { type: "iframe" });
	}

	return true;
});

console.log(
	"%cBackground working!",
	"padding: 1px 4px; color: #000000; background-color: #8fabeb; border-radius: 4px;"
);

},{}]},{},[1]);
