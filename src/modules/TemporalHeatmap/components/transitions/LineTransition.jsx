import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';

const LineTransition = observer(class LineTransition extends React.Component {
    constructor() {
        super();
    }

    static drawLine(x0, x1, y0, y1,key) {
        const line = d3.path();
        line.moveTo(x0, y0);
        line.lineTo(x1, y1);
        return (<path key={key} d={line.toString()} stroke={"lightgray"}/>)
    }

    drawLines() {
        let lines = [];
        const _self = this;
        this.props.transition.data.from.forEach(function (d) {
            if (_self.props.transition.data.to.includes(d)) {
                lines.push(LineTransition.drawLine(_self.props.firstHeatmapScale(d)+_self.props.rectWidth/2, _self.props.secondHeatmapScale(d)+10, 0 , _self.props.height,d));
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