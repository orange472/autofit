const $ = require("jquery");
const axios = require("axios");
const cheerio = require("cheerio");

var matchedTags0 = false;
var matchedTags1 = false;

chrome.runtime.onMessage.addListener(function (req, sender, send) {
	if (req.type == "iframe") {
		var iframe = document.createElement("iframe");
		iframe.src = chrome.extension.getURL("dialog.html");
		iframe.height = "30px";
		iframe.width = "100px";
		iframe.style.cssText = "position: fixed;";

		document.body.appendChild(iframe);
	}
});

chrome.runtime.sendMessage({ type: "tab" }, (res) => {
	scrape(res);
});

async function scrape(res) {
	// Runs on the current tab and tries to find a size chart.
	// 1) If the window is the original window, try to identify the type (men/women/kids)
	// associated with the product: if no type is found, then the main logic won't execute.
	// 2) If a type IS found, then generate a list of keys/tags (used in the scraping).
	// 3) Use jquery to scrape for potential links (filtered with tags) to size charts.
	// 4) Scrape the current page for a size chart.
	// 5) If no size chart is found, scrape each link from step 3 with Cheerio (using
	// Cheerio so that hopefully the extension can avoid opening up each link directly
	// and causing a distraction to the user).
	// 6) If no size chart is found and the USER ALLOWS IT (settings), open each link from
	// step 3 and scrape with jquery. Since the new windows will have an opener, the main
	// "else" statement, in which the scraping and window closing is done, will be executed.
	// 7) After all of this, if no size charts are found, then index.html will just tell the
	// user that no size chart could be found.

	var sizeChart = [];

	if (window.opener == null && !(res[0] == undefined)) {
		const activeTab = res[0];
		const tab = activeTab.url;
		const id = activeTab.id;

		const type = await identifyType();
		const keys = await createKeys(type);
		const links = await jqueryScrapeLinks();

		sizeChart = await jqueryScrapeChart(keys);

		if (type != null) {
			if (sizeChart.length == 0) {
				links.forEach(async (link) => {
					sizeChart = await cheerioScrapeChart(keys, link);

					if (sizeChart.length == 0) {
						var allowOpen = false;

						chrome.storage.sync.get(["settings"], (res) => {
							allowOpen = res.settings.open;
						});

						chrome.runtime.sendMessage(
							{ type: "open", origin: tab, id: id, keys: keys, userType: type },
							(res) => {
								if (res && allowOpen) {
									window.open(link);
								}
							}
						);
					} else {
						console.log("Found a size chart on an external page");
						await storeChart(sizeChart, tab);
						resolve(sizeChart, tab, id, keys, type);
					}
				});
			} else {
				console.log("Found a size chart on the current page");
				await storeChart(sizeChart, tab);
				resolve(sizeChart, tab, id, keys, type);
			}
		}
	} else if (window.opener != null) {
		/**Code for if the window was opened by the extension */
		try {
			const originalTab = window.opener.location.href;

			const getKeys = () => {
				return new Promise((resolve) => {
					chrome.storage.sync.get(["openers"], (res) => {
						let openers = res.openers;

						openers.forEach((opener) => {
							if (originalTab in opener) {
								resolve(opener.keys);
							}
						});
					});
				});
			};

			var keys = await getKeys();
			sizeChart = await jqueryScrapeChart(keys);

			if (!(sizeChart.length == 0)) {
				console.log("Found a size chart on an externally opened page");
				await storeChart(sizeChart, originalTab);

				chrome.storage.sync.get(["openers"], function (storage) {
					const openers = storage.openers;

					openers.some((pair) => {
						if (originalTab in pair) {
							let originalId = pair[originalTab];
							let originalType = pair.userType;

							resolve(sizeChart, originalTab, originalId, keys, originalType);
							return true;
						}
					});
				});
			}

			chrome.runtime.sendMessage(
				{ type: "close", origin: originalTab },
				(res) => {
					if (res) {
						window.close();
					}
				}
			);
		} catch (err) {
			console.log(new Error(err));
		}
	}
}

function identifyType() {
	var matched = false;
	const tags = [
		// filters through headings' (h1, h2, etc.) texts
		[
			"shirt",
			"jacket",
			"coat",
			"pants",
			"shorts",
			"top",
			"bottom",
			"joggers",
			"jeans",
		],
		// filters through headings' attributes (class, id, etc.)
		["product"],
	];
	const types = ["men", "women", "kids", "boys", "girls"];

	return new Promise((resolve) => {
		$(function () {
			$("h1, h2, h3, h4, h5, h6")
				.filter((i, el) => {
					var attributes = el.attributes;
					var values = [];

					//push attributes of header
					for (var i = 0; i < attributes.length; i++) {
						values.push(attributes[i].nodeValue);
					}

					//push attributes of header's children
					$(el)
						.children()
						.each((i, el) => {
							var childAttr = el.attributes;
							for (var i = 0; i < childAttr.length; i++) {
								values.push(childAttr[i].nodeValue);
							}
						});

					matched = tags[1].some((tag) => {
						return values.some((attr) => {
							return attr.includes(tag);
						});
					});

					return matched;
				})
				.each(function (i, element) {
					var text = $(element).text().toLowerCase();
					console.log("Found a header: " + text);

					matched = tags[0].some((tag) => {
						return text.includes(tag);
					});

					if (matched) {
						types.some((type) => {
							if (text.includes(type)) {
								resolve(type);
							}
						});
					}

					return !matched;
				});

			if (matched) {
				var url = window.location.href;
				types.some((type) => {
					if (url.includes(type)) {
						resolve(type);
					}
				});
			} else {
				resolve(null);
			}
		});
	});
}

function createKeys(type) {
	var types = [];
	var keys = [];

	if (type != null) {
		if (type == "boys" || type == "girls") {
			type = "kids";
		}
		types.push(type);
	} else {
		types.push("men", "women", "kids");
	}

	types.forEach((type) => {
		chrome.storage.sync.get([`${type}`], (res) => {
			let bodyParts = res[type];

			Object.keys(bodyParts).forEach((part) => {
				keys.push(part);
			});
		});
	});

	return new Promise((resolve) => {
		resolve(keys);
	});
}

function jqueryScrapeLinks() {
	return new Promise((resolve, reject) => {
		var links = [];

		const filteredLinks = $("a").filter((i, element) => {
			var text = $(element).text().toLowerCase();
			var tags = [
				["size", "fitting"],
				["guide", "chart"],
			];
			var matched =
				tags[0].some((tag) => {
					return text.includes(tag);
				}) &&
				tags[1].some((tag) => {
					return text.includes(tag);
				});

			return matched;
		});

		$(filteredLinks).each((i, element) => {
			links.push($(element).attr("href"));
		});

		resolve(links);
	});
}

function jqueryScrapeChart(keys) {
	return new Promise((resolve, reject) => {
		$(function () {
			var table = [];

			$("table")
				.filter((i, element) => {
					var rows = $(element).find("tr");
					var columnHeaders = $(rows).first().children();

					var matchedColumns = false;
					var matchedRows = false;
					matchedTags0 = false;
					matchedTags1 = false;

					$(columnHeaders).each((i, element) => {
						var text = $(element).text().toLowerCase();
						text = trimText(text);

						matchedColumns = isMatched(text, keys);

						if (matchedColumns) {
							return false;
						}
					});

					$(rows).each((i, element) => {
						var rowHeaders = $(element).children().first();
						var text = $(rowHeaders).text().toLowerCase();
						text = trimText(text);

						matchedRows = isMatched(text, keys);

						if (matchedRows) {
							return false;
						}
					});

					return matchedColumns && matchedRows;
				})
				.first()
				.find("tr")
				.each((i, element) => {
					var row = [];
					var cells = $(element).children();

					$(cells).each((i, element) => {
						row.push($(element).text().replace(/\n/g, ""));
					});

					table.push(row);
				});

			resolve(table);
		});
	});
}

function cheerioScrapeChart(keys, url) {
	// can't I just use jquery.get method?
	return new Promise(async (resolve, reject) => {
		const html = await axios.get(url);
		const ch = cheerio.load(html.data);
		var table = [];

		ch("table")
			.filter((i, element) => {
				var rows = ch(element).find("tr");
				var columnHeaders = ch(rows).first().children();

				var matchedColumns = false;
				var matchedRows = false;
				matchedTags0 = false;
				matchedTags1 = false;

				ch(columnHeaders).each((i, element) => {
					var text = ch(element).text().toLowerCase();
					text = trimText(text);

					matchedColumns = isMatched(text, keys);

					if (matchedColumns) {
						return false;
					}
				});

				ch(rows).each((i, element) => {
					var rowHeaders = ch(element).children().first();
					var text = ch(rowHeaders).text().toLowerCase();
					text = trimText(text);

					matchedRows = isMatched(text, keys);

					if (matchedRows) {
						return false;
					}
				});

				return matchedColumns && matchedRows;
			})
			.first()
			.find("tr")
			.each((i, element) => {
				var row = [];
				var cells = ch(element).children();

				ch(cells).each((i, element) => {
					row.push(ch(element).text().replace(/\n/g, ""));
				});

				table.push(row);
			});

		resolve(table);
	});
}

const isMatched = (text, keys) => {
	// Takes in a string of text and a list of keys and returns true if the text
	// contains a tag from an index of tags[] that has not been set to "true" yet. For
	// example, if the text contains a tag from index 0 of tags[], then the next time the
	// function is called, it will only return true if the text contains a tag from index 1
	// of tags[]. This ensures that the column headers and row headers, which are passed in
	// as parameters from the main functions, are unique.

	// Note: matchedTags0 and matchedTags1 are global booleans and are false by default.

	var tags = [["xs", "s", "small", "m", "medium", "l", "large", "xl"], []];

	keys.forEach((key) => {
		tags[1].push(key);
	});

	if (matchedTags0) {
		return tags[1].some((tag) => {
			return text.some((word) => {
				return word == tag;
			});
		});
	} else if (matchedTags1) {
		return tags[0].some((tag) => {
			return text.some((word) => {
				return word == tag;
			});
		});
	} else {
		matchedTags0 = tags[0].some((tag) => {
			return text.some((word) => {
				return word == tag;
			});
		});

		if (matchedTags0) {
			return matchedTags0;
		} else {
			matchedTags1 = tags[1].some((tag) => {
				return text.some((word) => {
					return word == tag;
				});
			});
			return matchedTags1;
		}
	}
};

const trimText = (text) => {
	/**
	 * Takes in a string of text, replaces \n (new lines) with " " (spaces), trims
	 * excess spaces off, and splits the text into an array separated by instances of " ".
	 * This trimmed text is then passed in as the "text" parameter of the isMatched() helper
	 * function.
	 */
	return text.replace(/\n/g, " ").trim().split(" ");
};

function storeChart(sizeChart, tab) {
	/**
	 * Description: Take the current tab's URL and associate it with a size chart, then
	 * store it as a key/value pair in Chrome's storage IF the current tab's value/array is
	 * empty.
	 */
	return new Promise(function (resolve, reject) {
		chrome.storage.sync.get(["sizeCharts"], function (res) {
			const storedCharts = res.sizeCharts;

			if (!(tab in storedCharts)) {
				storedCharts[tab] = [];
			}

			if (storedCharts[tab].length == 0) {
				storedCharts[tab] = sizeChart;

				chrome.storage.sync.set({ sizeCharts: storedCharts });
			}

			resolve(storedCharts);
		});
	});
}

function resolve(sizeChart, tab, id, keys, userType) {
	chrome.runtime.sendMessage({
		type: "resolve",
		sizeChart: sizeChart,
		tab: tab,
		id: id,
		keys: keys,
		userType: userType,
	});
}
