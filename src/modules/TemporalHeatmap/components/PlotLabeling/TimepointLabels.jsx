import React from "react";
import {observer} from "mobx-react";
import BlockTextField from "./BlockTextField";


/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed al
 */
const TimepointLabels = observer(class TimepointLabels extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 100,
            labels: []
        };
        this.updateDimensions = this.updateDimensions.bind(this);
    }

    /**
     * Add event listener
     */
    componentDidMount() {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions);
    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions);
    }

    componentDidUpdate(prevProps) {
        // Typical usage (don't forget to compare props):
        if (this.props.sidebarVisible !== prevProps.sidebarVisible) {
            this.updateDimensions();
        }
    }

    updateDimensions() {
        this.setState({
            width: this.refs.timepointLabels.parentNode.clientWidth
        });
    }

    /**
     * computes the width of a text
     * @param text
     * @param fontSize
     * @returns {number}
     */
    static getTextWidth(text, fontSize) {
        const context = document.createElement("canvas").getContext("2d");
        context.font = fontSize + "px Arial";
        return context.measureText(text).width;
    }

    setName(index, event) {
        this.props.timepoints[index].name(event.target.value)
    }

    render() {
        let labels = [];
        const _self = this;
        this.props.timepoints.forEach(function (d, i) {
            let pos;
            if (d.type === 'sample') {
                pos = _self.props.visMap.timepointPositions.timepoint[i] + _self.props.visMap.getTPHeight(d) / 2 + 4;
                labels.push(<g key={d.globalIndex} transform={"translate(0," + pos + ")"}><BlockTextField
                    width={_self.state.width / 3 * 2}
                    timepoint={d}/>
                    <g id="realign" transform={"translate(" + _self.state.width / 3 * 2 + ",0)"}
                       onMouseEnter={(e) => _self.props.showTooltip(e, "Realign patients")}
                       onMouseLeave={_self.props.hideTooltip}>
                        <g transform={"translate(0,4)"}>
                            <path fill="gray"
                                  d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"/>
                            <rect onClick={() => _self.props.store.applyPatientOrderToAll(d.globalIndex, true)}
                                  width={20} height={20}
                                  fill="none"
                                  pointerEvents="visible"/>
                        </g>
                    </g>
                </g>)
            }
            else {
                pos = _self.props.visMap.timepointPositions.timepoint[i] + _self.props.visMap.getTPHeight(d) / 2 + 4;
                labels.push(
                    <g id="realign" key={d.globalIndex}
                       transform={"translate(" + _self.state.width / 3 * 2 + "," + pos + ")"}
                       onMouseEnter={(e) => _self.props.showTooltip(e, "Realign patients")}
                       onMouseLeave={_self.props.hideTooltip}>
                        <g transform={"translate(0,4)"}>
                            <path fill="gray"
                                  d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"/>
                            <rect onClick={() => _self.props.store.applyPatientOrderToAll(d.globalIndex, true)}
                                  width={20} height={20}
                                  fill="none"
                                  pointerEvents="visible"/>
                        </g>
                    </g>)
            }
        });

        let offset = 15 + this.props.visMap.getTPHeight(this.props.timepoints[0]) / 2;
        return (
            <div ref="timepointLabels">
                <svg width={this.state.width} height={this.props.height}>
                    <line x1={this.state.width / 3 - 10} x2={this.state.width / 3}
                          y1={this.props.visMap.timepointPositions.timepoint[0] + offset}
                          y2={this.props.visMap.timepointPositions.timepoint[0] + offset} stroke='lightgray'/>
                    <line x1={this.state.width / 3} x2={this.state.width / 3}
                          y1={this.props.visMap.timepointPositions.timepoint[0] + offset}
                          y2={this.props.visMap.timepointPositions.timepoint[this.props.visMap.timepointPositions.timepoint.length - 1] + offset}
                          stroke='lightgray'/>
                    <line x1={this.state.width / 3 - 10} x2={this.state.width / 3}
                          y1={this.props.visMap.timepointPositions.timepoint[this.props.visMap.timepointPositions.timepoint.length - 1] + offset}
                          y2={this.props.visMap.timepointPositions.timepoint[this.props.visMap.timepointPositions.timepoint.length - 1] + offset}
                          stroke='lightgray'/>
                    <text y={15}
                          x={this.state.width / 3 - TimepointLabels.getTextWidth("Timepoint", 14) / 2}>Timepoint
                    </text>
                    {labels}
                </svg>
            </div>
        );
    }
});
export default TimepointLabels;
