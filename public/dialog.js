chrome.runtime.sendMessage({ type: "getBestSize" }, (res) => {
	document.getElementById("size").textContent = res;
});
