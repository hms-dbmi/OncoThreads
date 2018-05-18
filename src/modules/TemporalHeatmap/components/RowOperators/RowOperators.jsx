import React from 'react';
import {observer} from 'mobx-react';
import ReactMixins from './../../../../utils/ReactMixins';


/*
implements the icons and their functionality on the left side of the plot
 */
const RowOperators = observer(class RowOperators extends React.Component {
        constructor() {
            super();
            this.state = {highlightedVariable: "",width:0};
            this.sortTimepoint = this.sortTimepoint.bind(this);
            this.group = this.group.bind(this);
            this.unGroup = this.unGroup.bind(this);
            this.promote = this.promote.bind(this);
            this.handleDeleteLeave = this.handleDeleteLeave.bind(this);
            ReactMixins.call(this);
        }


        /**
         * calls the store function to group a timepoint
         * @param timepointIndex: Index of the timepoint to be grouped
         * @param variable: Variable with which the timepoint will be grouped
         */
        group(timepointIndex, variable) {
            if (this.props.store.isContinuous(variable, this.props.store.timepoints[timepointIndex].type)) {
                this.props.openBinningModal(variable, this.props.store.timepoints[timepointIndex].type, this.props.store.groupBinnedTimepoint, timepointIndex);
            }
            else {
                this.props.store.timepoints[timepointIndex].group(variable);
            }
        }

        /**
         * sorts a timepoint
         * the variable has to be declared a primary variable, then the timepoint is sorted
         * @param timepointIndex: Index of the timepoint to be sorted
         * @param variable: Variable with which the timepoint should be sorted
         */
        sortTimepoint(timepointIndex, variable) {
            if (this.props.store.timepoints[timepointIndex].isGrouped && this.props.store.isContinuous(variable, this.props.store.timepoints[timepointIndex].type)) {
                this.props.openBinningModal(variable, this.props.store.timepoints[timepointIndex].type, this.props.store.groupBinnedTimepoint, timepointIndex);
            }
            else {
                console.log(variable,timepointIndex);
                this.props.store.timepoints[timepointIndex].sort(variable, this.props.selectedPatients);
                            //If we are in realtime mode: apply sorting to all timepoints to avoid crossing lines
                if (this.props.store.rootStore.realTime) {
                    this.props.store.applySortingToAll(timepointIndex);
                }
            }
        }


        /**
         * ungoups a grouped timepoint
         * @param timepointIndex: Index of the timepoint to be regrouped
         * @param variable: variable which will be the future primary variable
         */
        unGroup(timepointIndex, variable) {
            this.props.store.timepoints[timepointIndex].unGroup(variable);
        }

        /**
         * promotes a variable at a timepoint to a primary variable
         * @param timepointIndex: index of the timepoint where the primary variable is changes
         * @param variable: variable to be the primary variable
         */
        promote(timepointIndex, variable) {
            if (this.props.store.timepoints[timepointIndex].isGrouped && this.props.store.isContinuous(variable, this.props.store.timepoints[timepointIndex].type)) {
                this.props.openBinningModal(variable, this.props.store.timepoints[timepointIndex].type, this.props.store.promoteBinnedTimepoint, timepointIndex);
            }
            else {

                this.props.store.timepoints[timepointIndex].promote(variable);
            }


        }

        /**
         * computes the width of a text. Returns 30 if the text width would be shorter than 30
         * @param text
         * @param fontSize
         * @param fontweight
         * @param maxWidth
         * @returns {number}
         */
        static cropText(text, fontSize, fontweight, maxWidth) {
            const context = document.createElement("canvas").getContext("2d");
            context.font = fontweight + " " + fontSize + "px Arial";
            const width = context.measureText(text).width;
            if (width > maxWidth) {
                for (let i = 1; i < text.length; i++) {
                    const context = document.createElement("canvas").getContext("2d");
                    context.font = fontSize + " px Arial";
                    let prevText = text.substr(0, i - 1).concat("...");
                    let currText = text.substr(0, i).concat("...");
                    let prevWidth = context.measureText(prevText).width;
                    let currWidth = context.measureText(currText).width;
                    if (currWidth > maxWidth && prevWidth < maxWidth) {
                        text = prevText;
                        break;
                    }
                }
            }
            return text;
        }

        /**
         * highlights variable for deletion and shows tooltip
         * @param e
         * @param variable
         */
        handleDeleteEnter(e, variable) {
            this.setState({highlightedVariable: variable});
            this.props.showTooltip(e, "Delete variable from all timepoints")
        }
        /**
         * unhighlights variable for deletion and hides tooltip
         */
        handleDeleteLeave() {
            this.setState({highlightedVariable: ""});
            this.props.hideTooltip();
        }

        /**
         * handle click on delete button
         * @param variable
         * @param timepointIndex
         */
        handleDelete(variable, timepointIndex) {
            this.setState({highlightedVariable: ""});
            this.props.hideTooltip();
            this.props.store.removeVariable(variable, this.props.store.timepoints[timepointIndex].type)
        }

        getSortIcon(timepointIndex, variable, iconScale, xPos, yPos) {
            return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseOver={(e) => this.props.showTooltip(e, "Sort timepoint after this variable")}
                       onMouseOut={this.props.hideTooltip}>
                <path fill="gray" d="M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z"/>
                <rect onClick={() => this.sortTimepoint(timepointIndex, variable)}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepointIndex, variable, "sort")}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
            </g>);
        }

        getGroupIcon(timepointIndex, variable, iconScale, xPos, yPos) {
            return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseEnter={(e) => this.props.showTooltip(e, "Group timepoint after this variable")}
                       onMouseLeave={this.props.hideTooltip}>
                <path fill="gray"
                      d="M12.5,19.5V3.47H14.53V19.5H12.5M9.5,19.5V3.47H11.53V19.5H9.5M4.5,7.5L8.53,11.5L4.5,15.47V12.47H1.5V10.5H4.5V7.5M19.5,15.47L15.5,11.5L19.5,7.5V10.5H22.5V12.47H19.5V15.47Z"/>
                <rect onClick={() => this.group(timepointIndex, variable)}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepointIndex, variable, "group")}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
            </g>);
        }

        getUnGroupIcon(timepointIndex, variable, iconScale, xPos, yPos) {
            return (
                <g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                   onMouseEnter={(e) => this.props.showTooltip(e, "Ungroup timepoint")}
                   onMouseLeave={this.props.hideTooltip}>
                    <path fill="gray"
                          d="M9,11H15V8L19,12L15,16V13H9V16L5,12L9,8V11M2,20V4H4V20H2M20,20V4H22V20H20Z"/>
                    <rect onClick={() => this.unGroup(timepointIndex, variable)}
                          onContextMenu={(e) => this.props.showContextMenu(e, timepointIndex, variable, "group")}
                          width={iconScale * 24} height={24}
                          fill="none"
                          pointerEvents="visible"/>
                </g>);
        }

        getDeleteIcon(timepointIndex, variable, iconScale, xPos, yPos) {
            return (
                <g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                   onMouseEnter={(e) => this.handleDeleteEnter(e, variable)}
                   onMouseLeave={this.handleDeleteLeave}>
                    <path fill="gray"
                          d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    <rect onClick={() => this.handleDelete(variable, timepointIndex)}
                          width={iconScale * 24} height={24}
                          fill="none"
                          pointerEvents="visible"/>
                </g>);
        }

        getRowLabel(timepointIndex, variable, xPos, yPos, iconScale, width, fontWeight, fontSize) {
            return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseEnter={(e) => this.props.showTooltip(e, "Promote this variable")}
                       onMouseLeave={this.props.hideTooltip}>
                <text style={{fontWeight: fontWeight, fontSize: fontSize}}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepointIndex, variable, "promote")}
                      onClick={(e) => this.promote(timepointIndex, variable, e)}>{RowOperators.cropText(variable, fontSize, fontWeight, width)}</text>
            </g>);
        }

        static getHighlightRect(height, width) {
            return <rect height={height} width={width} fill="#e8e8e8"/>
        }

        /**
         * Creates the Row operator for a timepoint
         * @param timepointIndex
         * @param grouped
         */
        getRowOperators(timepointIndex, grouped) {
            const _self = this;
            let pos = 0;
            return this.props.store.currentVariables[this.props.timepoints[timepointIndex].type].map(function (d, i) {
                let lineHeight;
                let fontWeight;
                if (d.variable === _self.props.timepoints[timepointIndex].primaryVariable) {
                    lineHeight = _self.props.visMap.primaryHeight;
                    fontWeight = "bold";
                }
                else {
                    lineHeight = _self.props.visMap.secondaryHeight;
                    fontWeight = "normal";
                }
                const transform = "translate(0," + pos + ")";
                const iconScale = (_self.props.visMap.secondaryHeight - _self.props.visMap.gap) / 20;
                let fontSize = 12;
                if (lineHeight < fontSize) {
                    fontSize = Math.round(lineHeight);
                }
                pos = pos + lineHeight + _self.props.visMap.gap;
                const yPos = -(iconScale * 24 - lineHeight) / 2;
                let secondIcon;
                if (!grouped) {
                    secondIcon = _self.getGroupIcon(timepointIndex, d.variable, iconScale, _self.state.width - iconScale * 48, yPos)
                }
                else {
                    secondIcon = _self.getUnGroupIcon(timepointIndex, d.variable, iconScale, _self.state.width - iconScale * 48, yPos)

                }
                let highlightRect = null;
                if (d.variable === _self.state.highlightedVariable) {
                    highlightRect = RowOperators.getHighlightRect(lineHeight, 200);
                }
                return <g key={d.variable} className={"clickable"} transform={transform}>
                    {highlightRect}
                    {_self.getRowLabel(timepointIndex, d.variable, 0, (lineHeight + fontSize) / 2, iconScale, _self.state.width - iconScale * 72, fontWeight, fontSize)}
                    {_self.getSortIcon(timepointIndex, d.variable, iconScale, (_self.state.width - iconScale * 72), yPos)}
                    {secondIcon}
                    {_self.getDeleteIcon(timepointIndex, d.variable, iconScale, (_self.state.width - iconScale * 24), yPos)}
                </g>
            });

        }

        render() {
            let rowHeader = [];
            const _self = this;
            this.props.timepoints.forEach(function (d, i) {
                let transform = "translate(0," + _self.props.posY[i] + ")";
                //Different icons and functions for grouped and ungrouped timepoints
                if (!d.isGrouped) {
                    rowHeader.push(<g key={"Operator" + i}
                                    transform={transform}>{_self.getRowOperators(i, false)}</g>)
                }
                else {
                    rowHeader.push(<g key={"Operator" + i}
                                    transform={transform}>{_self.getRowOperators(i, true)}</g>)
                }
            });
            let transform = "translate(0," + 20 + ")";
            return (
                <div>
                <svg width={this.state.width} height={this.props.height} >
                    <g transform={transform}>
                        {rowHeader}
                    </g>
                </svg>
                </div>
            )
        }
    }
    )
;
export default RowOperators;
