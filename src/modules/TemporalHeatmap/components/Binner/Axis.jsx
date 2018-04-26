import React from "react";
import {observer} from 'mobx-react';
import * as d3 from 'd3';
import ReactDOM from 'react-dom'



const Axis=observer(class Axis extends React.Component {
    componentDidUpdate() {
        this.renderAxis();
    }

    componentDidMount() {
        this.renderAxis()
    }

    renderAxis() {
        const node = ReactDOM.findDOMNode(this);
        d3.select(node).call(this.props.axis);
    }

    render() {
        const translatex = "translate(0," + (this.props.h) + ")";
        const translatey = "translate(-10, 0)";
        return (
            <g className="axis" transform={this.props.axisType === 'x' ? translatex : translatey}>
            </g>
        );
    }

});
export default Axis;