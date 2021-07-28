import React from "react";

import MeasurementSlider from "./Slider";
import { men_measurements } from "./Types";

function MenMeasurements() {
	return (
		<div className="measurements-container">
			{men_measurements.map((item) => {
				return (
					<MeasurementSlider
						type="men"
						name={item.name}
						min={item.min}
						max={item.max}
					/>
				);
			})}
		</div>
	);
}

export default MenMeasurements;
