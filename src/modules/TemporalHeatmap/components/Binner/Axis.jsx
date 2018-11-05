import React from "react";
import {observer} from 'mobx-react';
import * as d3 from 'd3';
import ReactDOM from 'react-dom'


const Axis = observer(class Axis extends React.Component {
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

    /**
     * computes the dimensions of a text
     * @param text
     * @param fontSize
     * @returns
     */
    static getTextWidth(text, fontSize) {
        const context = document.createElement("canvas").getContext("2d");
        context.font = fontSize + "px Arial";
        return context.measureText(text).width;
    }

    render() {
        const translatex = "translate(0," + (this.props.h) + ")";
        const translatey = "translate(-10, 0)";
        let textWidth = Axis.getTextWidth(this.props.label, 12);
        const textTranslateX = "translate(" + ((this.props.w - textWidth) / 2) + "," + 30 + ")";
        const textTranslateY = "translate(-30, " + ((this.props.h - textWidth) / 2) + ")rotate(270)";
        return (
            <g className="axis" transform={this.props.axisType === 'x' ? translatex : translatey}>
                <text fill="black"
                      transform={this.props.axisType === 'x' ? textTranslateX : textTranslateY}>{this.props.label}</text>
            </g>
        );
    }

});
export default Axis;