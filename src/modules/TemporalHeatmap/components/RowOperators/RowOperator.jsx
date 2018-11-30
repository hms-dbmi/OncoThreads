import React from 'react';
import {observer} from 'mobx-react';


/*
implements the icons and their functionality on the left side of the plot
 */
const RowOperator = observer(class RowOperator extends React.Component {
        constructor() {
            super();
            this.sortTimepoint = this.sortTimepoint.bind(this);
            this.group = this.group.bind(this);
            this.unGroup = this.unGroup.bind(this);
            this.promote = this.promote.bind(this);
            this.handleRowEnter = this.handleRowEnter.bind(this);
            this.handleRowLeave = this.handleRowLeave.bind(this);
        }


        /**
         * calls the store function to group a timepoint
         * @param timepoint: timepoint to be grouped
         * @param variableId
         */
        group(timepoint, variableId) {
            const variable = this.props.store.variableStores[timepoint.type].getById(variableId);
            if (variable.datatype === "NUMBER") {
                this.props.openBinningModal(variable, timepoint.type, derivedVariable => {
                    this.props.store.variableStores[timepoint.type].replaceDisplayedVariable(variableId, derivedVariable);
                    timepoint.group(derivedVariable.id);
                    this.props.store.rootStore.undoRedoStore.saveTimepointHistory("GROUP", variableId, timepoint.type, timepoint.localIndex)
                });
            }
            else {
                timepoint.group(variable.id);
                this.props.store.rootStore.undoRedoStore.saveTimepointHistory("GROUP", variableId, timepoint.type, timepoint.localIndex)
            }
        }

        /**
         * sorts a timepoint
         * the variable has to be declared a primary variable, then the timepoint is sorted
         * @param timepoint: timepoint to be sorted
         * @param variableId
         */
        sortTimepoint(timepoint, variableId) {
            const variable = this.props.store.variableStores[timepoint.type].getById(variableId);
            if (timepoint.isGrouped && variable.datatype === "NUMBER") {
                this.props.openBinningModal(variable, timepoint.type, derivedVariable => {
                    this.props.store.variableStores[timepoint.type].replaceDisplayedVariable(variableId, derivedVariable);
                    timepoint.group(derivedVariable.id);
                    this.props.store.rootStore.undoRedoStore.saveTimepointHistory("SORT", variableId, timepoint.type, timepoint.localIndex)

                });
            }
            else {
                timepoint.sort(variableId, this.props.selectedPatients);
                //If we are in realtime mode: apply sorting to all timepoints to avoid crossing lines
                if (this.props.store.rootStore.realTime) {
                    this.props.store.applyPatientOrderToAll(timepoint.globalIndex, false);
                }
                this.props.store.rootStore.undoRedoStore.saveTimepointHistory("SORT", variableId, timepoint.type, timepoint.localIndex)
            }
        }


        /**
         * ungoups a grouped timepoint
         * @param timepoint: timepoint to be regrouped
         * @param variable: variable which will be the future primary variable
         */
        unGroup(timepoint, variable) {
            timepoint.unGroup(variable);
            this.props.store.rootStore.undoRedoStore.saveTimepointHistory("UNGROUP", variable, timepoint.type, timepoint.localIndex)
        }

        /**
         * promotes a variable at a timepoint to a primary variable
         * @param timepoint: timepoint where the primary variable is changes
         * @param variableId
         */
        promote(timepoint, variableId) {
            const variable = this.props.store.variableStores[timepoint.type].getById(variableId);
            if (timepoint.isGrouped && variable.datatype === "NUMBER") {
                this.props.openBinningModal(variable, timepoint.type, derivedVariable => {
                    this.props.store.variableStores[timepoint.type].replaceDisplayedVariable(variableId, derivedVariable);
                    timepoint.promote(derivedVariable.id);
                    this.props.store.rootStore.undoRedoStore.saveTimepointHistory("PROMOTE", variableId, timepoint.type, timepoint.localIndex)
                });
            }
            else {
                timepoint.promote(variableId);
                this.props.store.rootStore.undoRedoStore.saveTimepointHistory("PROMOTE", variableId, timepoint.type, timepoint.localIndex)
            }
        }

        /**
         * crops text to a certain width and appends "..."
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
         * highlights variable
         */
        handleRowEnter(variable) {
            this.props.highlightVariable(variable);
        }

        /**
         * unhighlights variable for deletion and hides tooltip
         */
        handleRowLeave() {
            this.props.unhighlightVariable();
        }

        /**
         * handle click on delete button
         * @param variable
         * @param timepoint
         */
        handleDelete(variable, timepoint) {
            this.props.unhighlightVariable();
            this.props.hideTooltip();
            if (timepoint.type === "between" || this.props.currentVariables[timepoint.type].length > 1) {
                this.props.store.variableStores[timepoint.type].removeVariable(variable);
            }
            else {
                alert("Samples have to be represented by at least one variable");
            }
        }

        getSortIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (<g id="sort" transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseOver={(e) => this.props.showTooltip(e, "Sort timepoint by this variable")}
                       onMouseOut={this.props.hideTooltip}>
                <path fill="gray" d="M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z"/>
                <rect onClick={() => this.sortTimepoint(timepoint, variable)}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "SORT")}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
            </g>);
        }

        getGroupIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (<g id="group" transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseEnter={(e) => this.props.showTooltip(e, "Group timepoint by this variable")}
                       onMouseLeave={this.props.hideTooltip}>
                <path fill="gray"
                      d="M12.5,19.5V3.47H14.53V19.5H12.5M9.5,19.5V3.47H11.53V19.5H9.5M4.5,7.5L8.53,11.5L4.5,15.47V12.47H1.5V10.5H4.5V7.5M19.5,15.47L15.5,11.5L19.5,7.5V10.5H22.5V12.47H19.5V15.47Z"/>
                <rect onClick={() => this.group(timepoint, variable)}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "GROUP")}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
            </g>);
        }

        getUnGroupIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (
                <g id="ungroup" transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                   onMouseEnter={(e) => this.props.showTooltip(e, "Ungroup timepoint")}
                   onMouseLeave={this.props.hideTooltip}>
                    <path fill="gray"
                          d="M9,11H15V8L19,12L15,16V13H9V16L5,12L9,8V11M2,20V4H4V20H2M20,20V4H22V20H20Z"/>
                    <rect onClick={() => this.unGroup(timepoint, variable)}
                          onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "UNGROUP")}
                          width={iconScale * 24} height={24}
                          fill="none"
                          pointerEvents="visible"/>
                </g>);
        }

        getDeleteIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (
                <g id="delete" transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                   onMouseEnter={(e) => this.props.showTooltip(e, "Delete variable from all blocks ")}
                   onMouseLeave={this.props.hideTooltip}>>
                    <path fill="gray"
                          d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    <rect onClick={() => this.handleDelete(variable, timepoint)}
                          width={iconScale * 24} height={24}
                          fill="none"
                          pointerEvents="visible"/>
                </g>);
        }

        getRowLabel(timepoint, variable, name_var, desc, xPos, yPos, iconScale, width, fontWeight, fontSize) {
            if (!name_var) name_var = "";
            return (<g transform={"translate(" + xPos + "," + yPos + ")"}
                       onMouseEnter={(e) => this.props.showTooltip(e, "Promote variable " + name_var, desc)}
                       onMouseLeave={this.props.hideTooltip}>
                <text style={{fontWeight: fontWeight, fontSize: fontSize}}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "PROMOTE")}
                      onClick={() => this.promote(timepoint, variable)}>{RowOperator.cropText(this.props.store.variableStores[timepoint.type].getById(variable, timepoint.type).name, fontSize, fontWeight, width)}</text>
            </g>);
        }

        getHighlightRect(height) {
            return <rect height={height} width={this.props.width} fill="#e8e8e8"/>
        }

        /**
         * Creates the Row operator for a timepoint
         */
        getRowOperator() {
            const _self = this;
            let pos = 0;
            let rowOperators = [];
            this.props.timepoint.heatmap.forEach(function (d) {
                if (!d.isUndef || _self.props.store.showUndefined || d.variable === _self.props.timepoint.primaryVariableId) {
                    let lineHeight;
                    let fontWeight;
                    if (d.variable === _self.props.timepoint.primaryVariableId) {
                        lineHeight = _self.props.visMap.primaryHeight;
                        fontWeight = "bold";
                    }
                    else {
                        lineHeight = _self.props.visMap.secondaryHeight;
                        fontWeight = "normal";
                    }
                    const transform = "translate(0," + pos + ")";
                    const iconScale = (_self.props.visMap.secondaryHeight - _self.props.visMap.gap) / 20;
                    let fontSize = 10;
                    if (lineHeight < fontSize) {
                        fontSize = Math.round(lineHeight);
                    }
                    pos = pos + lineHeight + _self.props.visMap.gap;
                    const yPos = -(iconScale * 24 - lineHeight) / 2;
                    let secondIcon;
                    if (!_self.props.timepoint.isGrouped) {
                        secondIcon = _self.getGroupIcon(_self.props.timepoint, d.variable, iconScale, _self.props.width - iconScale * 48, yPos)
                    }
                    else {
                        secondIcon = _self.getUnGroupIcon(_self.props.timepoint, d.variable, iconScale, _self.props.width - iconScale * 48, yPos)

                    }
                    let highlightRect = null;
                    if (d.variable === _self.props.highlightedVariable) {
                        highlightRect = _self.getHighlightRect(lineHeight);
                    }
                    let currVar = _self.props.store.variableStores[_self.props.timepoint.type].getById(d.variable);
                    let name_var = currVar.name;
                    let desc;
                    if (currVar.description !== undefined) {
                        desc = "Description: " + currVar.description;
                    }
                    else {
                        desc = "Description: not available";
                    }

                    rowOperators.push(<g key={d.variable} className={"clickable"}
                                         onMouseEnter={() => _self.handleRowEnter(d.variable)}
                                         onMouseLeave={_self.handleRowLeave} transform={transform}>
                        {highlightRect}
                        {_self.getRowLabel(_self.props.timepoint, d.variable, name_var, desc, 0, (lineHeight + fontSize / 2) / 2, iconScale, _self.props.width - 3 * iconScale * 24, fontWeight, fontSize)}
                        {_self.getSortIcon(_self.props.timepoint, d.variable, iconScale, (_self.props.width - iconScale * 72), yPos)}
                        {secondIcon}
                        {_self.getDeleteIcon(_self.props.timepoint, d.variable, iconScale, (_self.props.width - iconScale * 24), yPos)}
                    </g>)
                }
            });
            return rowOperators;

        }

        render() {

            return (
                <g transform={this.props.transform}>
                    {this.getRowOperator()}
                </g>
            )
        }
    }
    )
;
export default RowOperator;
