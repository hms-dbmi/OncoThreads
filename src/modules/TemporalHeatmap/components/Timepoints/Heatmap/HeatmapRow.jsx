import React from 'react';
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
        this.handleRightClick = this.handleRightClick.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseEnterGlobal = this.handleMouseEnterGlobal.bind(this);
    }

    getRow() {
        let rects = [];
        const _self = this;

        //console.log(this.props.row.data);




        this.props.row.data.forEach(function (d, j) {
            let stroke = "none";
            let fill = _self.props.color(d.value);
            if (d.value === undefined) {
                stroke = "lightgray";
                fill = "white";
            }
            if (_self.props.selectedPatients.includes(d.patient)) {
                stroke = "black";
            }
            let str;

            if(_self.props.currVar.datatype==="NUMBER"){
                str=Math.round(d.value*100)/100;
            }
            else if (_self.props.currVar.derived && _self.props.currVar.datatype === "ORDINAL" && _self.props.currVar.modificationType === "continuousTransform") {
                let ind = _self.props.currVar.modification.binning.binNames.map(d => d.name).indexOf(d.value);
                str=d.value;
                if (_self.props.currVar.modification.binning.binNames[ind].modified) {
                    let low = Math.round(_self.props.currVar.modification.binning.bins[ind] * 100) / 100;

                    if (ind !== 0) {
                        low = low + 1;
                    }
                    str += ": " + low + " to " + Math.round(_self.props.currVar.modification.binning.bins[ind + 1] * 100) / 100;
                }
            }
            else{
                str=d.value;
            }

            rects.push(<rect stroke={stroke} onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, str)}
                             onMouseLeave={_self.handleMouseLeave}
                             onMouseDown={(e) => _self.handleMouseDown(e, d.patient)}
                             onMouseUp={_self.handleMouseUp} onDoubleClick={() => _self.handleDoubleClick(d.patient)}
                             onClick={_self.handleClick}
                             onContextMenu={(e) => _self.handleRightClick(e, d.patient, _self.props.timepoint, j)}
                             key={d.patient} height={_self.props.height}
                             width={_self.props.rectWidth}
                             x={_self.props.heatmapScale(d.patient) + _self.props.x}
                             fill={fill} opacity={_self.props.opacity}/>);
            if (d.value === undefined) {
                rects.push(<line stroke={stroke}
                                 key={d.patient + "UNDEFINED"} height={_self.props.height}
                                 width={_self.props.rectWidth}
                                 x1={_self.props.heatmapScale(d.patient) + _self.props.x}
                                 x2={_self.props.heatmapScale(d.patient) + _self.props.x + _self.props.rectWidth}
                                 y1={0}
                                 y2={_self.props.height}
                                 opacity={_self.props.opacity}/>);
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
            this.props.showTooltip(event, patient + ": " + value + ", Event start day: " + startDay + ", Duration: " + duration + " days")
        }
    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }

    /*showContextMenu(e, timepointIndex, variable, type) {
        this.setState({
            x: e.pageX,
            y: e.pageY,
            clickedTimepoint: timepointIndex,
            clickedVariable: variable,
            contextType: type
        });
        e.preventDefault();
    }*/

    hideContextMenu() {
        this.setState({
            contextType: "",
        })
    }

    handleRightClick(e, patient, timepoint, xposition) {
        //console.log("\n Right Clicked!");
        e.preventDefault();
        this.setState({
            dragging: false
        });
        this.props.showContextMenuHeatmapRow(e, patient, timepoint, xposition);


    }


    render() {
        return (
            this.getRow()
        )


    }
});
export default HeatmapRow;