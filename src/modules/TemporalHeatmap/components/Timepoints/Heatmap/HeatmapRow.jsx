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

        this.props.row.data.forEach(function (d) {
            let stroke = "none";
            let fill = _self.props.color(d.value);
            if (d.value === undefined) {
                stroke = "lightgray";
                fill = "none";
                rects.push(<line stroke={stroke}
                                 key={d.patient+"UNDEFINED"} height={_self.props.height}
                                 width={_self.props.rectWidth}
                                 x1={_self.props.heatmapScale(d.patient)+ _self.props.x}
                                 x2={_self.props.heatmapScale(d.patient) +_self.props.x+ _self.props.rectWidth}
                                 y1={0}
                                 y2={_self.props.height}
                                 opacity={_self.props.opacity}/>);
            }
            if (_self.props.selectedPatients.includes(d.patient)) {
                stroke = "black";
            }
            rects.push(<rect stroke={stroke} onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, d.value)}
                             onMouseLeave={_self.handleMouseLeave}
                             onMouseDown={(e) => _self.handleMouseDown(e, d.patient)}
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


    render() {
        return (
            this.getRow()
        )


    }
});
export default HeatmapRow;