import React from 'react';
import {observer} from "mobx-react"
import * as d3 from 'd3';
import ReactMixins from "../../../utils/ReactMixins.js";

import Timeline from './Timeline.jsx';
import TimelineBars from './TimelineBars.jsx'
import CategoricalRects from './CategoricalRects.jsx'
import SortArrow from './SortArrow.jsx'


const FirstChart=observer(class FirstChart extends React.Component{
    constructor(){
        super();
         this.state = {
            width: 0,
        };
         ReactMixins.call(this);
    }
    render(){
        const _self=this;
        const margin = {top: 20, right: 50, bottom: 30, left: 50},
            w = this.state.width - (margin.left + margin.right),
            h = this.props.height - (margin.top + margin.bottom);
        const transformTimeline = 'translate(' + margin.left + ',' + margin.top + ')';
        const y = d3.scalePoint()
            .domain(this.props.patientAttributes.map(function (d) {
                return d.patient;
            }))
            .range([0, h]);
        let metaAttributes=[];
        let arrows=[];
        let transformX=margin.left+0.63*w;
        const step=(0.37*w)/this.props.patientAttributeCategories.length;
        this.props.patientAttributeCategories.forEach(function (d,i) {
                if(d.datatype==="NUMBER"){
                    const transform="translate("+transformX+","+margin.top+")";
                    const transformArrow="translate("+transformX+",0)";
                    transformX+=step;
                    metaAttributes.push(<TimelineBars key={d.attribute+"_BAR"} transform={transform} y={y} width={step-2} height={h} patientAttributes={_self.props.patientAttributes} attribute={d.attribute}/>);
                    arrows.push(<SortArrow key={d.attribute+"_ARROW"} transform={transformArrow} attribute={d.attribute} eventStore={_self.props.eventStore}/>)
                }
                else{
                    const transform="translate("+transformX+","+margin.top+")";
                    const transformArrow="translate("+transformX+",0)";
                    transformX+=step;
                    metaAttributes.push(<CategoricalRects key={d.attribute+"_RECT"} transform={transform} y={y} width={step-2} height={h} patientAttributes={_self.props.patientAttributes} attribute={d.attribute}/>);
                    arrows.push(<SortArrow key={d.attribute+"_ARROW"} transform={transformArrow} attribute={d.attribute} eventStore={_self.props.eventStore}/>)
                }
        });
        return(
            <div>
                <svg width={this.state.width} height={this.props.height}>
                    {metaAttributes}
                    {arrows}
                    <Timeline transform={transformTimeline} y={y} width={0.6*w} height={h} sampleEvents={this.props.sampleEvents} currEvents={this.props.currentEvents}/>
                </svg>
            </div>
        )
    }
});
FirstChart.defaultProps = {
    width: 1000,
    height: 300,
};
export default FirstChart;