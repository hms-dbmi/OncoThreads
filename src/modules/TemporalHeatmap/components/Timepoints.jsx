import React from 'react';
import {observer} from 'mobx-react';
import Timepoint from "./Timepoint"
import * as d3 from "d3";

const Timepoints = observer(class Timepoints extends React.Component {
    constructor() {
        super();
        this.colorCategorical = d3.scaleOrdinal().range(['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a']);
    }


    getTimepoints() {
        const _self=this;
        return (this.props.timepointData.map(function (d, i) {
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "timepoint"} transform={transform}><Timepoint timepoint={d} index={i}
                                                                              primaryHeight={_self.props.primaryHeight}
                                                                              secondaryHeight={_self.props.secondaryHeight}
                                                                              rectWidth={_self.props.rectWidth}
                                                                              gap={_self.props.gap}
                                                                              width={_self.props.width}
                                                                              color={_self.colorCategorical}
                                                                              store={_self.props.store}
                                                                              visMap={_self.props.visMap}/>
            </g>);
        }))
    }

    render() {
        return (
            this.getTimepoints()
        )
    }
});
export default Timepoints;