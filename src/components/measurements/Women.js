import React from "react";

import MeasurementSlider from "./Slider";
import { women_measurements } from "./Types";

function WomenMeasurements() {
	return (
		<div className="measurements-container">
			{women_measurements.map((item) => {
				return (
					<MeasurementSlider
						type="women"
						name={item.name}
						min={item.min}
						max={item.max}
					/>
				);
			})}
		</div>
	);
}

export default WomenMeasurements;
