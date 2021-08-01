/* global chrome */
import React, { useState } from "react";
import {
	MemoryRouter as Router,
	Redirect,
	Route,
	Switch,
} from "react-router-dom";

import "./styles/App.css";
import SettingsIcon from "@material-ui/icons/Settings";

import Header from "./components/header/Header";
import MenMeasurements from "./components/measurements/Men";
import WomenMeasurements from "./components/measurements/Women";
import KidsMeasurements from "./components/measurements/Kids";
import RecommendedSize from "./components/recommended/Size";
import Settings from "./components/recommended/Settings";

function App() {
	const [clicked, setClicked] = useState(false);

	return (
		<div style={styles.mainContainer}>
			<div style={styles.secondaryContainer}>
				<div style={styles.subContainer1}>
					<Router>
						<Header />
						<Switch>
							<Redirect exact from="/" to="/men" />
							<Route path="/men" component={MenMeasurements} />
							<Route path="/women" component={WomenMeasurements} />
							<Route path="/kids" component={KidsMeasurements} />
						</Switch>
					</Router>
				</div>
			</div>

			<div className={clicked ? "light" : "dark"} style={styles.subContainer2}>
				<div
					style={{
						width: "100%",
						display: "flex",
						justifyContent: "center",
						marginTop: "4px",
					}}
				>
					<div style={styles.settingsSwitchContainer}>
						{clicked ? (
							<div className="roboto-300" style={{ fontSize: 24 }}>
								Settings
							</div>
						) : (
							<div
								className="roboto-300"
								style={{ fontSize: 24, color: "#fff" }}
							>
								Recommended Size
							</div>
						)}
						<button
							className="settings-button"
							onClick={() => setClicked(!clicked)}
						>
							<SettingsIcon
								style={
									clicked
										? { fill: "#555", transition: "0.1s ease" }
										: { fill: "#fff", transition: "0.1s ease" }
								}
							/>
						</button>
					</div>
				</div>

				{clicked ? <Settings /> : <RecommendedSize />}
			</div>
		</div>
	);
}

const styles = {
	mainContainer: {
		position: "relative",
		width: 350,
		height: "fit-content",
		backgroundColor: "#ffffff",
		border: "solid 1px #dedede",
		borderRadius: "6px",
		boxShadow: "1px 2px 5px #888888",
	},
	secondaryContainer: {
		height: "auto",
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	subContainer1: {
		position: "relative",
		width: "90%",
		height: "90%",
		padding: "10px 0",
	},
	subContainer2: {
		width: "100%",
		padding: "5px 0",
		marginTop: 8,
		borderRadius: "0 0 6px 6px",
	},
	settingsSwitchContainer: {
		position: "absolute",
		height: "24px",
		width: "90%",
		display: "flex",
		alignItems: "center",
		marginTop: 4,
	},
};

export default App;
