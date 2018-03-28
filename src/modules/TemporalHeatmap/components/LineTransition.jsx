import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';

const LineTransition = observer(class LineTransition extends React.Component {
    constructor() {
        super();
    }

    drawLine(x0, x1, y0, y1) {
        const line = d3.path();
        line.moveTo(x0, y0);
        line.lineTo(x1, y1);
        return (<path d={line.toString()} stroke={"lightgray"}/>)
    }

    drawLines() {
        let lines = [];
        const _self = this;
        this.props.transition.data.from.forEach(function (d) {
            if (_self.props.transition.data.to.includes(d)) {
                lines.push(_self.drawLine((_self.props.firstPositions[d].start + _self.props.firstPositions[d].end) / 2, (_self.props.secondPositions[d].start + _self.props.secondPositions[d].end) / 2, 0, _self.props.height))
            }
        });
        return lines;
    }


    render() {
        return (
            this.drawLines()
        )
    }
});
export default LineTransition;