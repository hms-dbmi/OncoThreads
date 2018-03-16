import * as d3 from "d3";
import React from "react";
import ReactDOM from 'react-dom'

class Axis extends React.Component {

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
        const translatex = "translate(0," + (this.props.h + 10) + ")";
        const translatey = "translate(-20, 0)";
        const translateLabelx="translate("+(this.props.w/2)+",30)";
        const translateLabely="translate(-40,"+this.props.h/2+")rotate(90)";
        return (
            <g className="axis" transform={this.props.axisType === 'x' ? translatex : translatey}>
                <text fill="black" transform={this.props.axisType === 'x' ? translateLabelx : translateLabely}>{this.props.label}</text>
            </g>
        );
    }

}
export default Axis;