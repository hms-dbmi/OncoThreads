import React from 'react';
import {observer} from 'mobx-react';
import UtilityFunctions from "../../../UtilityFunctions";
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
        this.handleRightClick = this.handleRightClick.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
    }

    getRow() {
        let rects = [];


        this.props.row.data.forEach((d, j) =>{
            let stroke = "none";
            let fill = this.props.currVar.colorScale(d.value);
            if (d.value === undefined) {
                stroke = "lightgray";
                fill = "white";
            }
            if (this.props.store.selectedPatients.includes(d.patient)) {
                stroke = "black";
            }
            let str;

            if(this.props.currVar.datatype==="NUMBER"){
                str=UtilityFunctions.getScientificNotation(d.value);
            }
            else if (this.props.currVar.derived && this.props.currVar.datatype === "ORDINAL" && this.props.currVar.modification.type === "continuousTransform") {
                str=d.value+" ("+UtilityFunctions.getScientificNotation(this.props.variableStore.getById(this.props.currVar.originalIds[0]).mapper[d.sample])+")";
            }
            else{
                str=d.value;
            }
            rects.push(<rect stroke={stroke} onMouseEnter={(e) => this.handleMouseEnter(e, d.patient, str)}
                             onMouseLeave={this.handleMouseLeave}
                             onMouseDown={(e) => this.handleMouseDown(e, d.patient)}
                             onMouseUp={this.handleMouseUp} onDoubleClick={() => this.handleDoubleClick(d.patient)}
                             onClick={this.handleClick}
                             onContextMenu={(e) => this.handleRightClick(e, d.patient, this.props.timepointIndex, j)}
                             key={d.patient} height={this.props.height}
                             width={this.props.rectWidth}
                             x={this.props.heatmapScale(d.patient) + this.props.xOffset}
                             fill={fill} opacity={this.props.opacity}/>);
            if (d.value === undefined) {
                rects.push(<line stroke={stroke}
                                 key={d.patient + "UNDEFINED"} height={this.props.height}
                                 width={this.props.rectWidth}
                                 x1={this.props.heatmapScale(d.patient) + this.props.xOffset}
                                 x2={this.props.heatmapScale(d.patient) + this.props.xOffset + this.props.rectWidth}
                                 y1={0}
                                 y2={this.props.height}
                                 opacity={this.props.opacity}/>);
            }
        });
        return rects;

    }

    handleDoubleClick(patient) {
        window.open("http://www.cbiohack.org/case.do#/patient?studyId=" + this.props.store.rootStore.study.studyId + "&caseId=" + patient);
    }


    handleMouseDown(event, patient) {
        if (event.button === 0) {
            if (!this.state.dragging) {
                this.props.store.handlePatientSelection(patient);
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
            this.props.store.handlePatientSelection(patient);
        }
        else {
            this.props.showTooltip(event, patient + ": " + value)
        }
    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }


    hideContextMenu() {
        this.setState({
            contextType: "",
        })
    }

    handleRightClick(e, patient, timepointIndex, xposition) {
        //console.log("\n Right Clicked!");
        e.preventDefault();
        this.setState({
            dragging: false
        });
        this.props.showContextMenuHeatmapRow(e, patient, timepointIndex, xposition);


    }


    render() {
        return (
            this.getRow()
        )


    }
});
export default HeatmapRow;