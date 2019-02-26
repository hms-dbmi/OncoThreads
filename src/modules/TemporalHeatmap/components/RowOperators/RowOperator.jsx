import React from 'react';
import {inject, observer} from 'mobx-react';
import SaveVariableDialog from "../Modals/SaveVariableDialog";


/*
implements the icons and their functionality on the left side of the plot
 */
const RowOperator = inject("rootStore", "uiStore", "undoRedoStore")(observer(class RowOperator extends React.Component {
        constructor() {
            super();
            this.state = {
                modalIsOpen: false,
                callback: "",
                currentVariable: ""
            };
            this.sortTimepoint = this.sortTimepoint.bind(this);
            this.group = this.group.bind(this);
            this.unGroup = this.unGroup.bind(this);
            this.promote = this.promote.bind(this);
            this.handleRowEnter = this.handleRowEnter.bind(this);
            this.handleRowLeave = this.handleRowLeave.bind(this);
        }


        openSaveModal(variable, callback) {
            this.setState({
                modalIsOpen: true,
                currentVariable: variable,
                callback: callback,
            })
        }

        /**
         * calls the store function to group a timepoint
         * @param timepoint: timepoint to be grouped
         * @param variable
         */
        group(timepoint, variable) {
            if (variable.datatype === "NUMBER") {
                this.props.openBinningModal(variable, timepoint.type, derivedVariable => {
                    this.props.rootStore.dataStore.variableStores[timepoint.type].replaceDisplayedVariable(variable.id, derivedVariable);
                    timepoint.group(derivedVariable.id);
                    this.props.undoRedoStore.saveTimepointHistory("GROUP", variable.id, timepoint.type, timepoint.localIndex)
                });
            }
            else {
                timepoint.group(variable.id);
                this.props.undoRedoStore.saveTimepointHistory("GROUP", variable.id, timepoint.type, timepoint.localIndex)
            }
        }

        /**
         * sorts a timepoint
         * the variable has to be declared a primary variable, then the timepoint is sorted
         * @param timepoint: timepoint to be sorted
         * @param variable
         */
        sortTimepoint(timepoint, variable) {
            if (timepoint.isGrouped && variable.datatype === "NUMBER") {
                this.props.openBinningModal(variable, timepoint.type, derivedVariable => {
                    this.props.rootStore.dataStore.variableStores[timepoint.type].replaceDisplayedVariable(variable.id, derivedVariable);
                    timepoint.group(derivedVariable.id);
                    this.props.undoRedoStore.saveTimepointHistory("SORT", variable.id, timepoint.type, timepoint.localIndex)

                });
            }
            else {
                timepoint.sort(variable.id, this.props.selectedPatients);
                //If we are in realtime mode: apply sorting to all timepoints to avoid crossing lines
                if (this.props.uiStore.realTime) {
                    this.props.rootStore.dataStore.applyPatientOrderToAll(timepoint.globalIndex, false);
                }
                this.props.undoRedoStore.saveTimepointHistory("SORT", variable.id, timepoint.type, timepoint.localIndex)
            }
        }


        /**
         * ungoups a grouped timepoint
         * @param timepoint: timepoint to be regrouped
         * @param variableId: variable which will be the future primary variable
         */
        unGroup(timepoint, variableId) {
            timepoint.unGroup(variableId);
            this.props.undoRedoStore.saveTimepointHistory("UNGROUP", variableId, timepoint.type, timepoint.localIndex)
        }

        /**
         * promotes a variable at a timepoint to a primary variable
         * @param timepoint: timepoint where the primary variable is changes
         * @param variable
         */
        promote(timepoint, variable) {
            if (timepoint.isGrouped && variable.datatype === "NUMBER") {
                this.props.openBinningModal(variable, timepoint.type, derivedVariable => {
                    this.props.rootStore.dataStore.variableStores[timepoint.type].replaceDisplayedVariable(variable.id, derivedVariable);
                    timepoint.promote(derivedVariable.id);
                    this.props.undoRedoStore.saveTimepointHistory("PROMOTE", variable.id, timepoint.type, timepoint.localIndex)
                });
            }
            else {
                timepoint.promote(variable.id);
                this.props.undoRedoStore.saveTimepointHistory("PROMOTE", variable.id, timepoint.type, timepoint.localIndex)
            }
        }

        removeVariable(variable, type) {
            const variableName = variable.name;
            if (variable.derived) {
                this.openSaveModal(variable, save => {
                    this.props.rootStore.dataStore.variableStores[type].updateSavedVariables(variable.id, save);
                    this.props.rootStore.dataStore.variableStores[type].removeVariable(variable.id);
                    this.props.undoRedoStore.saveVariableHistory("REMOVE", variableName, true);
                })
            }
            else {
                this.props.rootStore.dataStore.variableStores[type].removeVariable(variable.id);
                this.props.undoRedoStore.saveVariableHistory("REMOVE", variableName, true);
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
            if (timepoint.type === "between" || this.props.rootStore.dataStore.variableStores[timepoint.type].currentVariables.length > 1) {
                this.removeVariable(variable, timepoint.type);
            }
            else {
                alert("Samples have to be represented by at least one variable");
            }
        }

        getSortIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (<g id="sort" className="not_exported"
                       transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseOver={(e) => this.props.showTooltip(e, "Sort timepoint by this variable")}
                       onMouseOut={this.props.hideTooltip}>
                <path fill="gray" d="M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z"/>
                <rect onClick={() => this.sortTimepoint(timepoint, variable)}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, "SORT")}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
            </g>);
        }

        getGroupIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (<g id="group" className="not_exported"
                       transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseEnter={(e) => this.props.showTooltip(e, "Group timepoint by this variable")}
                       onMouseLeave={this.props.hideTooltip}>
                <path fill="gray"
                      d="M12.5,19.5V3.47H14.53V19.5H12.5M9.5,19.5V3.47H11.53V19.5H9.5M4.5,7.5L8.53,11.5L4.5,15.47V12.47H1.5V10.5H4.5V7.5M19.5,15.47L15.5,11.5L19.5,7.5V10.5H22.5V12.47H19.5V15.47Z"/>
                <rect onClick={() => this.group(timepoint, variable)}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, "GROUP")}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
            </g>);
        }

        getUnGroupIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (
                <g id="ungroup" className="not_exported"
                   transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                   onMouseEnter={(e) => this.props.showTooltip(e, "Ungroup timepoint")}
                   onMouseLeave={this.props.hideTooltip}>
                    <path fill="gray"
                          d="M9,11H15V8L19,12L15,16V13H9V16L5,12L9,8V11M2,20V4H4V20H2M20,20V4H22V20H20Z"/>
                    <rect onClick={() => this.unGroup(timepoint, variable.id)}
                          onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, "UNGROUP")}
                          width={iconScale * 24} height={24}
                          fill="none"
                          pointerEvents="visible"/>
                </g>);
        }

        getDeleteIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (
                <g id="delete" className="not_exported"
                   transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
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

        getRowLabel(timepoint, variable, xPos, yPos, iconScale, width, fontWeight, fontSize) {
            return (<g transform={"translate(" + xPos + "," + yPos + ")"}
                       onMouseEnter={(e) => this.props.showTooltip(e, "Promote variable " + variable.name, variable.description)}
                       onMouseLeave={this.props.hideTooltip}>
                <text style={{fontWeight: fontWeight, fontSize: fontSize}}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, "PROMOTE")}
                      onClick={() => this.promote(timepoint, variable)}>{RowOperator.cropText(variable.name, fontSize, fontWeight, width)}</text>
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
            this.props.rootStore.dataStore.variableStores[this.props.timepoint.type].fullCurrentVariables.forEach((d, i) => {
                if (!this.props.timepoint.heatmap[i].isUndef || _self.props.uiStore.showUndefined || d.id === _self.props.timepoint.primaryVariableId) {
                    let lineHeight = _self.props.rootStore.visStore.secondaryHeight;
                    let fontWeight = "normal";
                    if (d.id === _self.props.timepoint.primaryVariableId) {
                        lineHeight = _self.props.rootStore.visStore.primaryHeight;
                        fontWeight = "bold";
                    }
                    const transform = "translate(0," + pos + ")";
                    const iconScale = (_self.props.rootStore.visStore.secondaryHeight - _self.props.rootStore.visStore.gap) / 20;
                    let fontSize = 10;
                    if (lineHeight < fontSize) {
                        fontSize = Math.round(lineHeight);
                    }
                    pos = pos + lineHeight + _self.props.rootStore.visStore.gap;
                    const yPos = -(iconScale * 24 - lineHeight) / 2;
                    let secondIcon;
                    if (!_self.props.timepoint.isGrouped) {
                        secondIcon = _self.getGroupIcon(_self.props.timepoint, d, iconScale, _self.props.width - iconScale * 48, yPos)
                    }
                    else {
                        secondIcon = _self.getUnGroupIcon(_self.props.timepoint, d, iconScale, _self.props.width - iconScale * 48, yPos)

                    }
                    let highlightRect = null;
                    if (d.id === _self.props.highlightedVariable) {
                        highlightRect = _self.getHighlightRect(lineHeight);
                    }
                    rowOperators.push(<g key={d.id} className={"clickable"}
                                         onMouseEnter={() => _self.handleRowEnter(d.id)}
                                         onMouseLeave={_self.handleRowLeave} transform={transform}>
                        {highlightRect}
                        {_self.getRowLabel(_self.props.timepoint, d, 0, (lineHeight + fontSize / 2) / 2, iconScale, _self.props.width - 3 * iconScale * 24, fontWeight, fontSize)}
                        {_self.getSortIcon(_self.props.timepoint, d, iconScale, (_self.props.width - iconScale * 72), yPos)}
                        {secondIcon}
                        {_self.getDeleteIcon(_self.props.timepoint, d, iconScale, (_self.props.width - iconScale * 24), yPos)}
                    </g>)
                }
            });
            return rowOperators;

        }

        render() {
            return (
                <g transform={this.props.transform}>
                    {this.getRowOperator()}
                    <SaveVariableDialog modalIsOpen={this.state.modalIsOpen}
                                        variable={this.state.currentVariable}
                                        callback={this.state.callback}
                                        closeModal={() => this.setState({modalIsOpen: false})}/>
                </g>
            )
        }
    }))
;
export default RowOperator;
