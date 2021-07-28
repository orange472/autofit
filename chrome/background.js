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
			openers.push(req.origin);

			chrome.storage.sync.set({ openers: openers });

			send(true);
		});
	}

	if (req.type == "close") {
		chrome.storage.sync.get(["openers"], (res) => {
			const openers = res.openers;

			if (openers.includes(req.origin)) {
				send(true);
				var index = openers.indexOf(req.origin);
				openers.splice(index, 1);
			} else {
				send(false);
			}
		});
	}

	return true;
});

console.log(
	"%cBackground working!",
	"padding: 1px 4px; color: #000000; background-color: #8fabeb; border-radius: 4px;"
);
