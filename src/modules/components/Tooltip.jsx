import React from 'react';
import { observer } from 'mobx-react';
import { getTextWidth } from '../UtilityClasses/UtilityFunctions';

const TEXT_HEIGHT = 14;
const TOP_OFFSET = 10;
const PADDING = 5;

/**
 * Basic tooltip component
 */
const Tooltip = observer(({ visibility, x, y, line1, line2 }) => {
	const line1Width = getTextWidth(line1, TEXT_HEIGHT);
	const line2Width = getTextWidth(line2, TEXT_HEIGHT);
	const rectHeight = line2 !== undefined ? TEXT_HEIGHT * 2 + PADDING : TEXT_HEIGHT + PADDING;
	const textWidth = line1Width > line2Width ? line1Width : line2Width;
	const transformText = 'translate(5,15)';
	let left = x - textWidth / 2;
	let polygonOffset = 0;
	if (left < 0) {
		left = 0;
		polygonOffset = x - textWidth / 2;
	}
	if (x + textWidth / 2 > window.innerWidth) {
		left = window.innerWidth - textWidth;
		polygonOffset = -window.innerWidth + x + textWidth / 2;
	}
	return (
		<div
			style={{
				visibility,
				position: 'absolute',
				top: y - (line2 === undefined ? TEXT_HEIGHT + PADDING + TOP_OFFSET : TEXT_HEIGHT * 2 + PADDING + TOP_OFFSET),
				left,
			}}
		>
			<svg width={textWidth + PADDING * 2} height={rectHeight + PADDING}>
				<polygon
					points={`${textWidth / 2 + polygonOffset},${rectHeight} ${textWidth / 2 + PADDING * 2 + polygonOffset}
                        ,${rectHeight} ${(textWidth + PADDING * 2) / 2 + polygonOffset}
                        ,${rectHeight + PADDING}`}
					fill="gray"
				/>
				<rect width={textWidth + PADDING * 2} height={rectHeight} style={{ fill: 'gray' }} />
				<text width={textWidth} height={rectHeight + PADDING} style={{ fill: 'white' }} transform={transformText}>
					<tspan x="0" y="0">
						{line1}
					</tspan>
					<tspan x="0" y={TEXT_HEIGHT}>
						{line2}
					</tspan>
				</text>
			</svg>
		</div>
	);
});
export default Tooltip;
