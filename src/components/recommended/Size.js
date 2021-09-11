import React, { useState } from "react";

export default function RecommendedSize(props) {
	const [size, setSize] = useState("N/A");

	let matched = size.includes("Couldn't find size");

	return (
		<div style={styles.sizeContainer}>
			<p className={matched ? "roboto-500-sizenotfound" : "roboto-500"}>
				{size}
			</p>
		</div>
	);
}

const styles = {
	sizeContainer: {
		position: "relative",
		margin: "33px 0px 10px 5%",
		width: "90%",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
	},
};
