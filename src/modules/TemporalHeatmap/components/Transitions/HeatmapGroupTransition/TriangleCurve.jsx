import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';

/*
Creates a Triangle Curve
 */
const TriangleCurve = observer(class TriangleCurve extends React.Component {
    render() {
        let color = "#dddddd";
        let stroke="#cccccc"
        if (this.props.selectedPatients.includes(this.props.patient)) {
            color = "#b7b7b7"
            stroke="#cccccc"
        }
        const curvature = .5;
        const yi = d3.interpolateNumber(this.props.y0, this.props.y1),
            y2 = yi(curvature),
            y3 = yi(1 - curvature);

        let path = "M" + this.props.x0 + "," + this.props.y0
            + "C" + this.props.x0 + "," + y2
            + " " + this.props.x2 + "," + y3
            + " " + this.props.x2 + "," + this.props.y1
            + "C" + (this.props.x2) + "," + y3
            + " " + (this.props.x1) + "," + y2
            + " " + (this.props.x1) + "," + this.props.y0;
        return (<path d={path} stroke={stroke} fill={color} opacity={0.5}/>)
    }
});
export default TriangleCurve;