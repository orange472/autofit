(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

			openers.push({ [origin]: id });

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
		// sort size chart
		// match size chart
		// send message to open an iframe with recommended size

		console.log("Resolved, running analytics...");
		chrome.tabs.sendMessage(req.id, { type: "iframe" });
	}

	return true;
});

console.log(
	"%cBackground working!",
	"padding: 1px 4px; color: #000000; background-color: #8fabeb; border-radius: 4px;"
);

},{}]},{},[1]);
