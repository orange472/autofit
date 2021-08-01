import React from "react";

import SettingsSwitch from "./Switch";

export default function Settings() {
	const settings = [
		{
			name: "open",
			label: "Allow app to open new tabs",
		},
	];

	return (
		<div style={styles.settingsContainer}>
			{settings.map((item) => {
				return <SettingsSwitch name={item.name} label={item.label} />;
			})}
		</div>
	);
}

const styles = {
	settingsContainer: {
		position: "relative",
		width: "90%",
		margin: "41px 0px 0px 5%",
	},
};
