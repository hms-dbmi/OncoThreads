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
                pos = _self.props.sampleTPHeight / 2 + _self.props.posY[i] + 5;
                labels.push(<g key={d.globalIndex} transform={"translate(0," + pos + ")"}><BlockTextField
                    width={_self.state.width / 3 * 2}
                    timepoint={d}/>
                    <g transform={"translate(" + _self.state.width / 3 * 2 + ",0)scale(1.3)"}
                       onMouseEnter={(e) => _self.props.showTooltip(e, "Realign patients")}
                       onMouseLeave={_self.props.hideTooltip}>
                        <path fill="gray"
                              d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"/>
                        <rect onClick={() => _self.props.store.applyPatientOrderToAll(d.globalIndex, true)}
                              width={20} height={20}
                              fill="none"
                              pointerEvents="visible"/>
                    </g>
                </g>)
            }
            else {
                pos = _self.props.betweenTPHeight / 2 + _self.props.posY[i] + 5;
                labels.push(
                    <g key={d.globalIndex}
                       transform={"translate(" + _self.state.width / 3 * 2 + "," + pos + ")scale(1.3)"}
                       onMouseEnter={(e) => _self.props.showTooltip(e, "Realign patients")}
                       onMouseLeave={_self.props.hideTooltip}>
                        <path fill="gray"
                              d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"/>
                        <rect onClick={() => _self.props.store.applyPatientOrderToAll(d.globalIndex, true)}
                              width={20} height={20}
                              fill="none"
                              pointerEvents="visible"/>
                    </g>)
            }
        });

        let offset;
        if (this.props.betweenTPHeight !== 0) {
            offset = this.props.betweenTPHeight / 2 + 30;
        }
        else {
            offset = this.props.sampleTPHeight / 2 + 30;
        }
        return (
            <div ref="timepointLabels">
                <svg width={this.state.width} height={this.props.height}>
                    <line x1={this.state.width / 3 - 10} x2={this.state.width / 3} y1={this.props.posY[0] + offset}
                          y2={this.props.posY[0] + offset} stroke='lightgray'/>
                    <line x1={this.state.width / 3} x2={this.state.width / 3} y1={this.props.posY[0] + offset}
                          y2={this.props.posY[this.props.posY.length - 1] + offset} stroke='lightgray'/>
                    <line x1={this.state.width / 3 - 10} x2={this.state.width / 3}
                          y1={this.props.posY[this.props.posY.length - 1] + offset}
                          y2={this.props.posY[this.props.posY.length - 1] + offset} stroke='lightgray'/>
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
