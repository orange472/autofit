import React from "react";

import MeasurementSlider from "./Slider";
import { kids_measurements } from "./Types";

function KidsMeasurements() {
	return (
		<div className="measurements-container">
			{kids_measurements.map((item) => {
				return (
					<MeasurementSlider
						type="kids"
						name={item.name}
						min={item.min}
						max={item.max}
					/>
				);
			})}
		</div>
	);
}

export default KidsMeasurements;
