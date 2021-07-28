/* global chrome */
import React from "react";

function RecommendedSize(props) {
	chrome.runtime.onMessage.addListener(function (req, sender, send) {
		if (req.type == "resolve") {
		}
	});

	return (
		<div style={styles.sizeContainer}>
			<p className="roboto-500" style={{ color: "#fff" }}>
				S
			</p>
		</div>
	);
}

const styles = {
	sizeContainer: {
		width: "90%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
};

export default RecommendedSize;
