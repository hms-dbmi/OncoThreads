import React from 'react';
import {observer} from 'mobx-react';
import HeatmapRow from './HeatmapRow'

/*
creates a heatmap timepoint
 */
const HeatmapTimepoint = observer(class HeatmapTimepoint extends React.Component {


    getTimepoint() {
        const _self = this;
        let rows = [];
        let previousYposition = 0;
        this.props.timepoint.forEach(function (row, i) {
            //get the correct color scale depending on the type of the variable (STRING, continous or binary)
            let color = _self.props.visMap.getColorScale(row.variable,_self.props.currentVariables[i].type);
            const transform = "translate(0," + previousYposition + ")";
            if (row.variable === _self.props.primaryVariable) {
                rows.push(<g key={row.variable} transform={transform}>
                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.visMap.primaryHeight}
                                opacity={1}
                                color={color}
                    x={(_self.props.visMap.sampleRectWidth-_self.props.rectWidth)/2}/>;
                </g>);
                previousYposition += _self.props.visMap.primaryHeight + _self.props.visMap.gap;
            }
            else {
                rows.push(<g key={row.variable} transform={transform}>
                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.visMap.secondaryHeight}
                                opacity={0.5}
                                color={color}
                                x={(_self.props.visMap.sampleRectWidth-_self.props.rectWidth)/2}/>;
                </g>);
                previousYposition += _self.props.visMap.secondaryHeight + _self.props.visMap.gap;
            }
        });
        return (rows)
    }

    render() {
        return (
            this.getTimepoint()
        )
    }
});
export default HeatmapTimepoint;