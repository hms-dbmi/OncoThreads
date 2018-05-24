import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';
import * as d3 from "d3";
/*
creats a row in the heatmap
 */
const HeatmapRow = observer(class HeatmapRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({
            dragging: false,
        });
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleDoubleClick=this.handleDoubleClick.bind(this);
    }

    getRow() {
        let rects = [];
        const _self = this;
        this.props.row.data.forEach(function (d) {
            let stroke = "none";
            if (_self.props.selectedPatients.includes(d.patient)) {
                stroke = "black"
            }
            rects.push(<rect stroke={stroke} onMouseEnter={(e) => _self.handleMouseEnter(e,d.patient,d.value)}
                             onMouseLeave={_self.handleMouseLeave} onMouseDown={() => _self.handleMouseDown(d.patient)}
                             onMouseUp={_self.handleMouseUp} onDoubleClick={()=>_self.handleDoubleClick(d.patient)} key={d.patient} height={_self.props.height}
                             width={_self.props.rectWidth}
                             x={_self.props.heatmapScale(d.patient) + _self.props.x}
                             fill={_self.props.color(d.value)} opacity={_self.props.opacity}/>);
        });
        return rects;

    }
    handleDoubleClick(patient){
        window.open("http://www.cbiohack.org/case.do#/patient?studyId="+this.props.store.rootStore.study.studyId+"&caseId="+patient);
    }


    //added for drawing lines

static drawLine(x0, x1, y0, y1, key, mode, strokeColor) {
    const curvature = .5;
    const yi = d3.interpolateNumber(y0, y1),
        y2 = yi(curvature),
        y3 = yi(1 - curvature);

    let path = "M" + x0 + "," + y0
        + "C" + x0 + "," + y2
        + " " + x1 + "," + y3
        + " " + x1 + "," + y1;
    if(mode) {
        return (<path key={key+"-solid"} d={path} stroke={strokeColor} fill="none" strokeWidth= "22" opacity="0.2"/>)
    } else {
        return (<path key={key+"-dashed"} d={path} stroke={strokeColor} strokeDasharray="5, 5" fill="none"/>)
    }
}
    handleMouseDown(patient) {
        if (!this.state.dragging) {
            this.props.onDrag(patient);
        }
        this.setState({
            dragging: true
        });

    }

    handleMouseUp() {
        this.setState({
            dragging: false
        })
    }

    handleMouseEnter(event,patient,value) {
        if (this.state.dragging) {
            this.props.onDrag(patient);
        }
        else {
            this.props.showTooltip(event,patient+": "+value)
        }
    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }


    render() {
       // return (
         //   this.getRow()
        //)


        /*if(this.props.store.rootStore.globalTime || this.props.store.rootStore.transitionOn) {
            return (
                this.getGlobalRow()
            )
        } else {
            return (
                this.getRow()
            )
        }*/

        if(this.props.store.rootStore.globalTime) {
            return (
                this.getGlobalRow()
            )
        } else {
            return (
                this.getRow()
            )
        }




    }
});
export default HeatmapRow;