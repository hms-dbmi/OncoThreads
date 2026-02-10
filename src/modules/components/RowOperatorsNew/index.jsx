import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import RowOperator from './RowOperator';
import { withUICallbacks } from '../UICallbacksContext';

/**
 * Component for rowOperators of the timepoints
 = */
const RowOperators = inject('rootStore')(
	observer(
		class RowOperators extends React.Component {
			render() {
				const rowHeader = [];
				this.props.rootStore.dataStore.timepoints.forEach((d, i) => {
					const transform = `translate(0,${this.props.rootStore.visStore.newTimepointPositions.timepoint[i]})`;
					// Different icons and functions for grouped and ungrouped timepoints
					rowHeader.push(
						<RowOperator
							key={d.globalIndex}
							transform={transform}
							timepoint={d}
							width={this.props.width}
							highlightVariable={this.props.setHighlightedVariable}
							unhighlightVariable={this.props.removeHighlightedVariable}
							highlightedVariable={this.props.highlightedVariable}
						/>
					);
				});
				return (
					<div>
						<svg width={this.props.width || 150} height={this.props.rootStore.visStore.svgHeight}>
							{rowHeader}
						</svg>
					</div>
				);
			}
		}
	)
);
RowOperators.propTypes = {
	width: PropTypes.number.isRequired,
	setHighlightedVariable: PropTypes.func.isRequired,
	removeHighlightedVariable: PropTypes.func.isRequired,
	highlightedVariable: PropTypes.string,
};
RowOperators.defaultProps = {
	highlightedVariable: undefined,
};
export default withUICallbacks(RowOperators);
