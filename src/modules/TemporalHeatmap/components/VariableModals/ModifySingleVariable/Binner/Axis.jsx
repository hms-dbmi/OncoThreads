import PropTypes from 'prop-types';
import React from 'react';
import { observer } from 'mobx-react';
import * as d3 from 'd3';
import ReactDOM from 'react-dom';
import {getTextWidth} from 'modules/TemporalHeatmap/UtilityClasses/UtilityFunctions';


/**
 * Axis component
 */
const Axis = observer(class Axis extends React.Component {
    componentDidMount() {
        this.renderAxis();
    }

    componentDidUpdate() {
        this.renderAxis();
    }

    renderAxis() {
        // eslint-disable-next-line react/no-find-dom-node
        const node = ReactDOM.findDOMNode(this);
        d3.select(node).call(this.props.axis);
    }


    render() {
        const translatex = `translate(0,${this.props.h})`;
        const translatey = 'translate(-10, 0)';
        const textWidth = getTextWidth(this.props.label, 12);
        const textTranslateX = `translate(${(this.props.w - textWidth) / 2},${30})`;
        const textTranslateY = `translate(-30, ${(this.props.h - textWidth) / 2})rotate(270)`;
        return (
            <g className="axis" transform={this.props.axisType === 'x' ? translatex : translatey}>
                <text
                    fill="black"
                    transform={this.props.axisType === 'x' ? textTranslateX : textTranslateY}
                >
                    {this.props.label}
                </text>
            </g>
        );
    }
});
Axis.propTypes = {
    h: PropTypes.number.isRequired,
    w: PropTypes.number.isRequired,
    axis: PropTypes.func.isRequired,
    axisType: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
};
export default Axis;
