import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';

/**
 * Component for the creation of a "TriangleCurve" for the heatmap group transition
 */
const TriangleCurve = observer(class TriangleCurve extends React.Component {
    render() {
        let color = "#dddddd";
        let stroke = "#cccccc";
        if (this.props.isSelected) {
            color = "#afafaf";
            stroke = "#cccccc"
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
        const curve = <path d={path} fill={color} opacity={0.5}/>;
        const outline = <path d={path} fill={"none"} stroke={stroke} opacity={0.5}/>;
        return (<g>
            {curve}
            {outline}
        </g>)
    }
});
export default TriangleCurve;