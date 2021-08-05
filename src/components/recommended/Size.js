import React, { useState } from "react";
import ExpandIcon from "@material-ui/icons/ExpandMore";

import Stats from "./Stats";

export default function RecommendedSize(props) {
	const [size, setSize] = useState("S");
	const [expanded, setExpanded] = useState(false);

	let matched = size.includes("Couldn't find size");

	return (
		<div style={styles.sizeContainer}>
			<p className={matched ? "roboto-500-sizenotfound" : "roboto-500"}>
				{size}
			</p>
			<button onClicked={() => setExpanded(!expanded)}>
				<ExpandIcon style={styles.expandIcon} />
			</button>
			{expanded && <Stats />}
		</div>
	);
}

const styles = {
	sizeContainer: {
		position: "relative",
		margin: "33px 0px 0px 5%",
		width: "90%",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
	},
	expandIcon: {
		fill: "white",
		height: "28px",
		width: "28px",
	},
};
