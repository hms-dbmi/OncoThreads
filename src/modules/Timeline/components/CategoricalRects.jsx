import React from 'react';
import {observer} from "mobx-react"
import * as d3 from 'd3';

const CategoricalRects = observer(class CategoricalRects extends React.Component {
    constructor() {
        super();
        this.color=d3.scaleOrdinal().range(["red","green","blue"])
    }
    componentDidMount(){
        const _self=this;
        let categories=[];
        this.props.patientAttributes.forEach(function (d,i) {
            if(!categories.includes(d[_self.props.attribute])){
                categories.push(d[_self.props.attribute]);
            }
        });
        this.color.domain(categories)
    }
    render() {
        const _self = this;
        let content = [];
        this.props.patientAttributes.forEach(function (d, i) {
            content.push(<rect key={_self.props.attribute+"_"+d.patient+"RECT"} height={10} width={10} y={_self.props.y(d.patient) - 5}
                            fill={_self.color(d[_self.props.attribute])}/>);
            content.push(<text  key={_self.props.attribute+"_"+d.patient+"TEXT"} y={_self.props.y(d.patient) + 4} x={12} fontSize={8}>{d[_self.props.attribute]}</text>)
        });
        return (
            <g transform={this.props.transform}>
                {content}
            </g>
        )
    }
});
export default CategoricalRects;