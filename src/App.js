import React from "react";
import {
	MemoryRouter as Router,
	Redirect,
	Route,
	Switch,
} from "react-router-dom";

import "./styles/App.css";

import Header from "./components/header/Header";
import MenMeasurements from "./components/measurements/Men";
import WomenMeasurements from "./components/measurements/Women";
import KidsMeasurements from "./components/measurements/Kids";
import RecommendedSize from "./components/recommended/Size";

function App() {
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

			<div className="subContainer2" style={styles.subContainer2}>
				<RecommendedSize />
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
		height: "fit-content",
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "5px 0",
		marginTop: 8,
		backgroundColor: "#333",
		borderRadius: "0 0 6px 6px",
	},
};

export default App;
