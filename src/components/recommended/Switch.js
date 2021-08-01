/* global chrome */
import React, { useState, useEffect } from "react";

import "../../styles/SettingsSwitch.css";

export default function Switch(props) {
	const [checked, setChecked] = useState(false);

	const getSettings = () => {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get(["settings"], function (res) {
				if (props.name in res.settings) {
					console.log(res.settings);
					resolve(res.settings);
				} else {
					reject(new Error("Setting does not match."));
				}
			});
		});
	};

	useEffect(() => {
		getSettings().then((res) => {
			setChecked(res[props.name]);
		});
	}, []);

	useEffect(() => {
		getSettings().then((res) => {
			res[props.name] = checked;

			chrome.storage.sync.set({ settings: res });
		});
	}, [checked]);

	return (
		<label className="label" style={{ marginBottom: "8px" }}>
			<div className="label-text">{props.label}</div>
			<div
				className="toggle"
				style={checked ? styles.checked : styles.unchecked}
			>
				<input
					className="switch"
					type="checkbox"
					style={{ display: "none" }}
					onClick={() => setChecked(!checked)}
					checked={checked}
				/>
				<div className="switch-thumb"></div>
			</div>
		</label>
	);
}

const styles = {
	checked: {
		background: "#9ab8f5",
		border: "solid 2px #9ab8f5",
		transition: "0.4s ease",
	},
	unchecked: {
		background: "#eeb927",
		border: "solid 2px #eeb927",
		transition: "0.4s ease",
	},
};
