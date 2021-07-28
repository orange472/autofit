const $ = require("jquery");
const axios = require("axios");
const cheerio = require("cheerio");

var matchedTags0 = false;
var matchedTags1 = false;

chrome.runtime.sendMessage({ type: "tab" }, async (res) => {
	/**
	 * Description: This function runs on the current tab and tries to find a size chart.
	 * 1) If the window is the original window, try to identify the type (men, women,
	 * kids) associated with the product. If no type is found, then the function will
	 * resolve and the logic inside the "if statements" won't be executed.
	 * 2) If a type is found, generate a list of keys/tags (used in the scraping).
	 * 3) Use jquery to scrape for potential links to size charts.
	 * 4) Scrape the current page for a size chart.
	 * 5) If no size chart is found, scrape each link from step 3 with Cheerio (using
	 * Cheerio so that hopefully the extension can avoid opening up each link directly
	 * and causing a distraction to the user).
	 * 6) If no size chart is found and the USER ALLOWS IT (settings), open each link from
	 * step 3 and scrape with jquery. Since the new windows will have an opener, the main
	 * "else" statement, in which the scraping and window closing is done, will be executed.
	 * 7) After all of this, if no size charts are found, then index.html will just tell the
	 * user that no size chart could be found.
	 */
	var sizeChart = [];
	var store = [];

	if (window.opener == null) {
		const tab = res[0].url;
		const type = await identifyType();
		const keys = await createKeys(type);
		const links = await jqueryScrapeLinks();

		sizeChart = await jqueryScrapeChart(keys);
		store = await storeChart(sizeChart, tab);

		if (sizeChart.length == 0 && type != null) {
			links.forEach(async (link) => {
				sizeChart = await cheerioScrapeChart(keys, link);
				store = await storeChart(sizeChart, tab);

				if (sizeChart.length == 0) {
					chrome.runtime.sendMessage({ type: "open", origin: tab }, (res) => {
						if (res) {
							window.open(link);
						}
					});
				} else {
					chrome.runtime.sendMessage({ type: "resolve" });
				}
			});
		} else {
			chrome.runtime.sendMessage({ type: "resolve" });
		}
	} else {
		const originalTab = window.opener.location.href;
		const keys = await createKeys(null);
		sizeChart = await jqueryScrapeChart(keys);
		store = await storeChart(sizeChart, originalTab);

		if (sizeChart.length != 0) {
			chrome.runtime.sendMessage({ type: "resolve" });
		}

		chrome.runtime.sendMessage({ type: "close", origin: originalTab }, (res) => {
			if (res) {
				window.close();
			}
		});
	}
});

function identifyType() {
	$(function () {});
	return new Promise((resolve, reject) => {
		resolve("men");
	});
}

function createKeys(type) {
	var types = [];
	var keys = [];

	if (type != null) {
		types.push(type);
	} else {
		types.push("men", "women", "kids");
	}

	return new Promise((resolve, reject) => {
		types.forEach((type) => {
			chrome.storage.sync.get([`${type}`], (res) => {
				let measurements = res[type];

				Object.keys(measurements).forEach((measurement) => {
					keys.push(measurement);
				});
			});
		});

		resolve(keys);
	});
}

function jqueryScrapeLinks() {
	/**
	 * Description: Using jquery, find links with a given set of tags and return
	 * their href values.
	 */
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
						var text = trimText($(element).text().toLowerCase());

						matchedColumns = isMatched(text, keys);

						if (matchedColumns) {
							return false;
						}
					});

					$(rows).each((i, element) => {
						var rowHeaders = $(element).children().first();
						var text = trimText($(rowHeaders).text().toLowerCase());

						matchedRows = isMatched(text, keys);

						if (matchedRows) {
							return false;
						}
					});

					return matchedColumns && matchedRows;
				})
				.find("tr")
				.each((i, element) => {
					var row = [];
					var cells = $(element).children();

					$(cells).each((i, element) => {
						row.push($(element).text());
					});

					table.push(row);
				});

			resolve(table);
		});
	});
}

function cheerioScrapeChart(keys, url) {
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
					var text = trimText(ch(element).text().toLowerCase());

					matchedColumns = isMatched(text, keys);

					if (matchedColumns) {
						return false;
					}
				});

				ch(rows).each((i, element) => {
					var rowHeaders = ch(element).children().first();
					var text = trimText(ch(rowHeaders).text().toLowerCase());

					matchedRows = isMatched(text, keys);

					if (matchedRows) {
						return false;
					}
				});

				return matchedColumns && matchedRows;
			})
			.find("tr")
			.each((i, element) => {
				var row = [];
				var cells = ch(element).children();

				ch(cells).each((i, element) => {
					row.push(ch(element).text());
				});

				table.push(row);
			});

		resolve(table);
	});
}

const isMatched = (text, keys) => {
	/**
	 * Description: Helper function for jqueryScrapeChart(); and cheerioScrapeChart();
	 * Purpose: Takes in a string of text and a list of keys and returns true if the text
	 * contains a tag from an index of tags[] that has not been set to "true" yet. For
	 * example, if the text contains a tag from index 0 of tags[], then the next time the
	 * function is called, it will only return true if the text contains a tag from index 1
	 * of tags[]. This ensures that the column headers and row headers, which are passed in
	 * as parameters from the main functions, are unique.
	 *
	 * Note: matchedTags0 and matchedTags1 are global booleans and are false by default.
	 */
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
	 * Description: Helper function for jqueryScrapeChart(); and cheerioScrapeChart();
	 * Purpose: Takes in a string of text, replaces \n (new lines) with " " (spaces), trims
	 * excess spaces off, and splits the text into an array separated by instances of " ".
	 * This trimmed text is then passed in as the "text" parameter of the isMatched() helper
	 * function.
	 */
	return text.replace(/\n/g, " ").trim().split(" ");
};

function storeChart(sizeChart, tab) {
	/**
	 * Description: Take the current tab's URL and associate it with a size chart, then
	 * store it as a key/value pair in Chrome's storage if the current tab's value/array is
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

//Don't think I need this function, but I'll keep it for now.
function getChart(tab) {
	/**
	 * Description: Access the size charts in Chrome's storage and return the key/value
	 * pair associated with the inputted parameter. If the key/value pair exists, create
	 * an empty pair with the inputted parameter as the key.
	 */
	return new Promise(function (resolve, reject) {
		chrome.storage.sync.get(["sizeCharts"], function (res) {
			var sizeCharts = res.sizeCharts;

			if (!(tab in sizeCharts)) {
				sizeCharts[tab] = [];
			}

			resolve(sizeCharts[tab]);
		});
	});
}
