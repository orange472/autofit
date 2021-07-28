import React, { useState } from "react";
import { useHistory } from "react-router-dom";

function Header() {
	const [inches, setInches] = useState(true);

	const history = useHistory();

	const onChange = (event) => {
		history.push(`/${event.target.value}`);
	};

	return (
		<div style={styles.headerContainer}>
			<p className="roboto-400" style={{ marginRight: 10 }}>
				AutoFit
			</p>

			<div style={styles.unitsContainer}>
				<button
					style={{
						...styles.button,
						...(inches ? styles.toggled : styles.untoggled),
					}}
					onClick={() => setInches(true)}
				>
					in
				</button>
				<p style={{ margin: "0 3px" }}>/</p>
				<button
					style={{
						...styles.button,
						...(inches ? styles.untoggled : styles.toggled),
					}}
					onClick={() => setInches(false)}
				>
					cm
				</button>
			</div>

			<div style={styles.navContainer}>
				<select onChange={onChange} style={styles.select}>
					<option style={styles.option} value="men">
						Men
					</option>
					<option style={styles.option} value="women">
						Women
					</option>
					<option style={styles.option} value="kids">
						Kids
					</option>
				</select>
			</div>
		</div>
	);
}

const styles = {
	headerContainer: {
		height: 40,
		width: "100%",
		padding: "4px 0px",
		background: "transparent",
		display: "flex",
		alignItems: "center",
		justifyContent: "start",
	},
	navContainer: {
		width: "auto",
		position: "absolute",
		float: "right",
		right: 0,
	},
	unitsContainer: {
		width: "fitContent",
		display: "flex",
		marginLeft: "0.25rem",
		alignItems: "center",
		fontFamily: "'Open Sans', sans-serif",
		fontWeight: 300,
		fontSize: "16px",
		color: "#000000",
	},
	select: {
		height: "28px",
		width: "125px",
		padding: "2px 20px 2px 6px",
		fontFamily: "'Open Sans', sans-serif",
		fontWeight: 300,
		fontSize: "16px",
		color: "#000000",
		textDecoration: "none",
		boxShadow: "0px 1px 3px -2px #414141",
		borderRadius: "4px",
		border: "solid 1px #e8eaed",
	},
	option: {
		fontFamily: "'Roboto', sans-serif",
		fontWeight: 300,
		fontSize: "16px",
		color: "#000000",
	},
	button: {
		height: "28px",
		width: "28px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontFamily: "'Open Sans', sans-serif",
		fontWeight: 300,
		fontSize: "16px",
		borderRadius: "3px",
	},
	toggled: {
		color: "#1e97fa",
		boxShadow: "inset 1px 1px 2px -1px #414141",
		border: "solid 1px rgb(218, 218, 218)",
		transition: "0.1s",
	},
	untoggled: {
		color: "#333333",
		boxShadow: "1px 1px 2px -1px #414141",
		border: "solid 1px #e8eaed",
		transition: "0.1s",
	},
};

export default Header;
