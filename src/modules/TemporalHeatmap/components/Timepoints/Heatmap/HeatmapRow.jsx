import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';
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
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleMouseEnter=this.handleMouseEnter.bind(this);
        this.handleMouseEnterGlobal=this.handleMouseEnterGlobal.bind(this);
    }

    getRow() {
        let rects = [];
        const _self = this;

        //console.log(this.props.row.data);

        this.props.row.data.forEach(function (d) {
            let stroke = "none";
            let fill=_self.props.color(d.value);
            if(d.value===undefined){
                stroke="lightgray";
                fill="white";
            }
            if (_self.props.selectedPatients.includes(d.patient)) {
                stroke = "black";
            }
            rects.push(<rect stroke={stroke} onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, d.value)}
                             onMouseLeave={_self.handleMouseLeave} onMouseDown={(e) => _self.handleMouseDown(e,d.patient)}
                             onMouseUp={_self.handleMouseUp} onDoubleClick={() => _self.handleDoubleClick(d.patient)}
                             key={d.patient} height={_self.props.height}
                             width={_self.props.rectWidth}
                             x={_self.props.heatmapScale(d.patient) + _self.props.x}
                             fill={fill} opacity={_self.props.opacity}/>);
        });
        return rects;

    }

    handleDoubleClick(patient) {
        window.open("http://www.cbiohack.org/case.do#/patient?studyId=" + this.props.store.rootStore.study.studyId + "&caseId=" + patient);
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
        if (mode) {
            return (
                <path key={key + "-solid"} d={path} stroke={strokeColor} fill="none" strokeWidth="22" opacity="0.2"/>)
        } else {
            return (<path key={key + "-dashed"} d={path} stroke={strokeColor} strokeDasharray="5, 5" fill="none"/>)
        }
    }

    handleMouseDown(event,patient) {
        if(event.button===0) {
            if (!this.state.dragging) {
                this.props.onDrag(patient);
            }
            this.setState({
                dragging: true
            });
        }

    }

    handleMouseUp() {
        this.setState({
            dragging: false
        })
    }

    handleMouseEnter(event, patient, value) {
        if (this.state.dragging) {
            this.props.onDrag(patient);
        }
        else {
            this.props.showTooltip(event, patient + ": " + value)
        }
    }

    handleMouseEnterGlobal(event, patient, value, startDay, duration) {
        if (this.state.dragging) {
            this.props.onDrag(patient);
        }
        else {
            this.props.showTooltip(event, patient + ": " + value + ", Event start day: " + startDay + ", Duration: "+ duration + " days")
        }
    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }


    render() {
            return (
                this.getRow()
            )


    }
});
export default HeatmapRow;