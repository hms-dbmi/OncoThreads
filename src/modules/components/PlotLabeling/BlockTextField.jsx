import React from 'react';
import { observer } from 'mobx-react';
import { getTextWidth } from '../../UtilityClasses/UtilityFunctions';

/**
 * crops the text to a certain size
 */
function cropText(text, fontSize, maxWidth) {
	let returnText = text.toString();
	const width = getTextWidth(returnText, fontSize);
	if (width > maxWidth) {
		let prevText = returnText.substr(0, 0);
		for (let i = 1; i < returnText.length; i += 1) {
			const currText = returnText.substr(0, i);
			const prevWidth = getTextWidth(prevText, fontSize);
			const currWidth = getTextWidth(currText, fontSize);
			if (currWidth > maxWidth && prevWidth < maxWidth) {
				returnText = prevText;
				break;
			}
			prevText = currText;
		}
	}
	return returnText;
}

/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */
const BlockTextField = observer(({ timepoint, width, height }) => {
	const croppedText = cropText(timepoint.name, (height - 2) / 2, width);
	return (
		<g>
			<rect width={width - 2} height={height - 2} x={1} y={1} fill="white" stroke="darkgrey" />
			<text
				width={width - 2}
				height={height - 2}
				y={20}
				style={{ font: '14px Sans-Serif' }}
				x={(width - getTextWidth(croppedText, (height - 2) / 2)) / 2 + 1}
			>
				{croppedText}
			</text>
			<foreignObject className="not_exported" style={{ width, height }}>
				<input
					style={{ textAlign: 'center', width, height }}
					value={timepoint.name}
					onChange={(e) => timepoint.setName(e.target.value)}
					type="text"
				/>
			</foreignObject>
		</g>
	);
});
export default BlockTextField;
