/* global chrome */
import React, { useState, useEffect } from "react";

import "../../styles/Slider.css";

export default function MeasurementSlider(props) {
	const name = props.name.toLowerCase();
	const [value, setValue] = useState(0);
	const [empty, setEmpty] = useState(false);

	const handleChange = (event) => {
		let value = event.target.value;

		if (event.target.type === "number") {
			if (value.length === 0) {
				setEmpty(true);
			} else {
				setEmpty(false);
				// limit user input to 4 digits
				value = value.slice(0, 4);
			}
		} else {
			setEmpty(false);
		}

		setValue(value);
	};

	const getData = async () => {
		var data = new Promise(function (resolve, reject) {
			chrome.storage.sync.get([`${props.type}`], function (res) {
				if (props.type === "men") {
					resolve(res.men);
				} else if (props.type === "women") {
					resolve(res.women);
				} else if (props.type === "kids") {
					resolve(res.kids);
				}
				//resolve(res[props.type])
			});
		});

		return await data; //returns current list of measurements
	};

	const storeData = async (value) => {
		var newData = new Promise(function (resolve, reject) {
			getData().then((res) => {
				res[name] = value; //update value here

				if (props.type === "men") {
					chrome.storage.sync.set({ men: res }, () => {
						resolve(res);
					});
				} else if (props.type === "women") {
					chrome.storage.sync.set({ women: res }, () => {
						resolve(res);
					});
				} else if (props.type === "kids") {
					chrome.storage.sync.set({ kids: res }, () => {
						resolve(res);
					});
				}
			});
		});

		return await newData; //returns new list of measurements
	};

	useEffect(() => {
		try {
			getData().then((res) => {
				setValue(parseInt(res[name]));
			});
		} catch (error) {
			setValue(0);
			console.log(error);
		}
	}, []);

	useEffect(() => {
		storeData(value).then((res) => {
			console.log(
				"%c Value stored! New values:",
				"color: #ebebeb; background-color: #333333;"
			);
			console.log(res);
		});
	}, [value]);

	return (
		<div style={styles.container}>
			<label className="roboto-300" style={{ minWidth: "25%" }}>
				{props.name}
			</label>
			<input
				className="range"
				type="range"
				value={empty ? 0 : value}
				min={props.min}
				max={props.max}
				onChange={handleChange}
			/>
			<input
				className="textarea"
				type="number"
				value={value}
				placeholder="Value"
				min={props.min}
				max={props.max}
				onChange={handleChange}
				style={
					value.length === 0
						? { caretColor: "#1d1d1d" }
						: value.length === 1
						? { caretColor: "#4d4d4d" }
						: value.length === 2
						? { caretColor: "#7d7d7d" }
						: value.length === 3
						? { caretColor: "#a8a8a8" }
						: value.length >= 4
						? { caretColor: "#d1d1d1" }
						: // sets the caret color to that of
						  // length == 1 because, on render,
						  // the value is set to 0 but has no
						  // "length" associated with it for
						  // some reason
						  { caretColor: "#454545" }
				}
			/>
		</div>
	);
}

const styles = {
	container: {
		width: "100%",
		marginTop: "0.25rem",
		display: "flex",
		alignItems: "center",
		justifyContent: "start",
	},
};
