import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import SaveVariableDialog from '../Modals/SaveVariableDialog';
import SingleTimepoint from '../../stores/SingleTimepoint';


/**
 * Component for row operators of one timepoint in BlockView
 */
const RowOperator = inject('rootStore', 'uiStore', 'undoRedoStore')(observer(class RowOperator extends React.Component {
    /**
     * crops text to a certain width and appends "..."
     * @param {string} text
     * @param {number} fontSize
     * @param {*} fontweight
     * @param {number} maxWidth
     * @returns {number}
     */
    static cropText(text, fontSize, fontweight, maxWidth) {
        let returnText = text;
        const context = document.createElement('canvas').getContext('2d');
        context.font = `${fontweight} ${fontSize}px Arial`;
        const width = context.measureText(text).width;
        if (width > maxWidth) {
            for (let i = 1; i < text.length; i += 1) {
                const prevText = text.substr(0, i - 1).concat('...');
                const currText = text.substr(0, i).concat('...');
                const prevWidth = context.measureText(prevText).width;
                const currWidth = context.measureText(currText).width;
                if (currWidth > maxWidth && prevWidth < maxWidth) {
                    returnText = prevText;
                    break;
                }
            }
        }
        return returnText;
    }

    constructor(props) {
        super(props);
        this.state = {
            modalIsOpen: false,
            callback: '',
            currentVariable: '',
        };
        this.iconScale = (props.rootStore.visStore.secondaryHeight) / 20;
        this.iconDimensions = 24;
        this.sortTimepoint = this.sortTimepoint.bind(this);
        this.group = this.group.bind(this);
        this.unGroup = this.unGroup.bind(this);
        this.promote = this.promote.bind(this);
        this.handleRowEnter = this.handleRowEnter.bind(this);
        this.handleRowLeave = this.handleRowLeave.bind(this);
    }


    /**
     * creates an icon for sorting and associates it with the corresponding functions
     * @param {SingleTimepoint} timepoint
     * @param {(DerivedVariable|OriginalVariable)} variable
     * @param {number} xPos
     * @param {number} yPos
     * @return {g}
     */
    getSortIcon(timepoint, variable, xPos, yPos) {
        return (
            <g
                id="sort"
                className="not_exported"
                transform={`translate(${xPos},${yPos})scale(${this.iconScale})`}
                onMouseOver={e => this.props.showTooltip(e, 'Sort timepoint by this variable')}
                onMouseOut={this.props.hideTooltip}
            >
                <path fill="gray" d="M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z" />
                <rect
                    onClick={() => this.sortTimepoint(timepoint, variable)}
                    onContextMenu={e => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, 'SORT')}
                    width={this.iconScale * this.iconDimensions}
                    height={this.iconDimensions}
                    fill="none"
                    pointerEvents="visible"
                />
            </g>
        );
    }

    /**
     * creates an icon for grouping and associates it with the corresponding functions
     * @param {SingleTimepoint} timepoint
     * @param {(DerivedVariable|OriginalVariable)} variable
     * @param {number} xPos
     * @param {number} yPos
     * @return {g}
     */
    getGroupIcon(timepoint, variable, xPos, yPos) {
        return (
            <g
                id="group"
                className="not_exported"
                transform={`translate(${xPos},${yPos})scale(${this.iconScale})`}
                onMouseEnter={e => this.props.showTooltip(e, 'Group timepoint by this variable')}
                onMouseLeave={this.props.hideTooltip}
            >
                <path
                    fill="gray"
                    d="M12.5,19.5V3.47H14.53V19.5H12.5M9.5,19.5V3.47H11.53V19.5H9.5M4.5,7.5L8.53,11.5L4.5,15.47V12.47H1.5V10.5H4.5V7.5M19.5,15.47L15.5,11.5L19.5,7.5V10.5H22.5V12.47H19.5V15.47Z"
                />
                <rect
                    onClick={() => this.group(timepoint, variable)}
                    onContextMenu={e => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, 'GROUP')}
                    width={this.iconScale * this.iconDimensions}
                    height={this.iconDimensions}
                    fill="none"
                    pointerEvents="visible"
                />
            </g>
        );
    }

    /**
     * creates an icon for ungrouping and associates it with the corresponding functions
     * @param {SingleTimepoint} timepoint
     * @param {(DerivedVariable|OriginalVariable)} variable
     * @param {number} xPos
     * @param {number} yPos
     * @return {g}
     */
    getUnGroupIcon(timepoint, variable, xPos, yPos) {
        return (
            <g
                id="ungroup"
                className="not_exported"
                transform={`translate(${xPos},${yPos})scale(${this.iconScale})`}
                onMouseEnter={e => this.props.showTooltip(e, 'Ungroup timepoint')}
                onMouseLeave={this.props.hideTooltip}
            >
                <path
                    fill="gray"
                    d="M9,11H15V8L19,12L15,16V13H9V16L5,12L9,8V11M2,20V4H4V20H2M20,20V4H22V20H20Z"
                />
                <rect
                    onClick={() => this.unGroup(timepoint, variable.id)}
                    onContextMenu={e => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, 'UNGROUP')}
                    width={this.iconScale * this.iconDimensions}
                    height={this.iconDimensions}
                    fill="none"
                    pointerEvents="visible"
                />
            </g>
        );
    }

    /**
     * creates an icon for deleting and associates it with the corresponding functions
     * @param {SingleTimepoint} timepoint
     * @param {(DerivedVariable|OriginalVariable)} variable
     * @param {number} xPos
     * @param {number} yPos
     * @return {g}
     */
    getDeleteIcon(timepoint, variable, xPos, yPos) {
        return (
            <g
                id="delete"
                className="not_exported"
                transform={`translate(${xPos},${yPos})scale(${this.iconScale})`}
                onMouseEnter={e => this.props.showTooltip(e, 'Delete variable from all blocks ')}
                onMouseLeave={this.props.hideTooltip}
            >
                <path
                    fill="gray"
                    d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
                />
                <rect
                    onClick={() => this.handleDelete(variable, timepoint)}
                    width={this.iconScale * this.iconDimensions}
                    height={this.iconDimensions}
                    fill="none"
                    pointerEvents="visible"
                />
            </g>
        );
    }

    /**
     * gets the label for a rot in a timepoint
     * @param {SingleTimepoint} timepoint
     * @param {(DerivedVariable|OriginalVariable)} variable
     * @param {number} xPos
     * @param {number} yPos
     * @param {number} width
     * @param {*} fontWeight
     * @param {number} fontSize
     * @return {g}
     */
    getRowLabel(timepoint, variable, xPos, yPos, width, fontWeight, fontSize) {
        return (
            <g
                transform={`translate(${xPos},${yPos})`}
                onMouseEnter={e => this.props.showTooltip(e, `Promote variable ${variable.name}`, variable.description)}
                onMouseLeave={this.props.hideTooltip}
            >
                <text
                    style={{ fontWeight, fontSize }}
                    onContextMenu={e => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, 'PROMOTE')}
                    onClick={() => this.promote(timepoint, variable)}
                >
                    {RowOperator.cropText(variable.name, fontSize, fontWeight, width)}
                </text>
            </g>
        );
    }

    /**
     * gets grey rectangle for highlighting a row
     * @param {number} height
     * @return {rect}
     */
    getHighlightRect(height) {
        return <rect height={height} width={this.props.width} fill="#e8e8e8" />;
    }

    /**
     * Creates the Row operators for a timepoint
     */
    getRowOperator() {
        let pos = 0;
        const iconWidth = this.iconScale * this.iconDimensions;
        const rowOperators = [];
        this.props.rootStore.dataStore.variableStores[this.props.timepoint.type]
            .fullCurrentVariables.forEach((d, i) => {
                if (!this.props.timepoint.heatmap[i].isUndef
                || this.props.uiStore.showUndefined
                || d.id === this.props.timepoint.primaryVariableId) {
                    let lineHeight = this.props.rootStore.visStore.secondaryHeight;
                    let fontWeight = 'normal';
                    if (d.id === this.props.timepoint.primaryVariableId) {
                        lineHeight = this.props.rootStore.visStore.primaryHeight;
                        fontWeight = 'bold';
                    }
                    const transform = `translate(${this.iconDimensions},${pos})`;
                    pos += lineHeight + this.props.rootStore.uiStore.horizontalGap;
                    let fontSize = 10;
                    if (lineHeight < fontSize) {
                        fontSize = Math.round(lineHeight);
                    }
                    const yPos = -(iconWidth - lineHeight) / 2;
                    const currentX = this.props.width - this.iconDimensions;
                    let groupUngroup;
                    if (!this.props.timepoint.isGrouped) {
                        groupUngroup = this.getGroupIcon(
                            this.props.timepoint, d, currentX - 2 * iconWidth, yPos,
                        );
                    } else {
                        groupUngroup = this.getUnGroupIcon(
                            this.props.timepoint, d, currentX - 2 * iconWidth, yPos,
                        );
                    }
                    let highlightRect = null;
                    if (d.id === this.props.highlightedVariable) {
                        highlightRect = this.getHighlightRect(lineHeight);
                    }
                    rowOperators.push(
                        <g
                            key={d.id}
                            className="clickable"
                            onMouseEnter={() => this.handleRowEnter(d.id)}
                            onMouseLeave={this.handleRowLeave}
                            transform={transform}
                        >
                            {highlightRect}
                            {this.getRowLabel(
                                this.props.timepoint, d, 0, (lineHeight + fontSize / 2) / 2,
                                currentX - 3 * iconWidth, fontWeight, fontSize,
                            )}
                            {this.getSortIcon(
                                this.props.timepoint, d, (currentX - 3 * iconWidth), yPos,
                            )}
                            {groupUngroup}
                            {this.getDeleteIcon(
                                this.props.timepoint, d, (currentX - iconWidth), yPos,
                            )}
                        </g>,
                    );
                }
            });
        return rowOperators;
    }


    getRaelign() {
        const pos = (this.props.rootStore.visStore.getTPHeight(this.props.timepoint)
            - this.iconDimensions) / 2;
        return (
            <g
                transform={`translate(0,${pos})`}
                onClick={() => this.realignPatients(this.props.timepoint.globalIndex)}
                className="not_exported"
                onMouseEnter={e => this.props.showTooltip(e, 'Realign patients')}
                onMouseLeave={this.props.hideTooltip}
            >
                <path
                    fill="gray"
                    d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"
                />
                <rect
                    width={this.iconDimensions}
                    height={this.iconDimensions}
                    fill="none"
                    pointerEvents="visible"
                />
            </g>
        );
    }

    /**
     * realigns patiens so column order of patients is restored
     * @param {number} index - timepoint index
     */
    realignPatients(index) {
        this.props.rootStore.dataStore.applyPatientOrderToAll(index);
        this.props.undoRedoStore.saveRealignToHistory(index);
    }

    /**
     * opens the modal for saving a variable
     * @param {string} variableId
     * @param callback
     */
    openSaveModal(variableId, callback) {
        this.setState({
            modalIsOpen: true,
            currentVariable: variableId,
            callback,
        });
    }

    /**
     * sorts a timepoint
     * the variable has to be declared a primary variable, then the timepoint is sorted
     * @param {SingleTimepoint} timepoint - timepoint to be sorted
     * @param {(DerivedVariable|OriginalVariable)} variable
     */
    sortTimepoint(timepoint, variable) {
        if (timepoint.isGrouped && variable.datatype === 'NUMBER') {
            this.props.openBinningModal(variable, (derivedVariable) => {
                this.props.rootStore.dataStore.variableStores[timepoint.type]
                    .replaceDisplayedVariable(variable.id, derivedVariable);
                timepoint.group(derivedVariable.id);
                this.props.undoRedoStore.saveTimepointHistory('SORT', variable.id, timepoint.type, timepoint.localIndex);
            });
        } else {
            timepoint.sort(variable.id, this.props.rootStore.dataStore.selectedPatients);
            // If we are in realtime mode: apply sorting to all timepoints to avoid crossing lines
            if (this.props.uiStore.realTime) {
                this.props.rootStore.dataStore.applyPatientOrderToAll(timepoint.globalIndex);
            }
            this.props.undoRedoStore.saveTimepointHistory('SORT', variable.id, timepoint.type, timepoint.localIndex);
        }
    }

    /**
     * calls the store function to group a timepoint
     * @param {SingleTimepoint} timepoint - timepoint to be grouped
     * @param {(DerivedVariable|OriginalVariable)} variable
     */
    group(timepoint, variable) {
        if (variable.datatype === 'NUMBER') {
            this.props.openBinningModal(variable, (derivedVariable) => {
                this.props.rootStore.dataStore.variableStores[timepoint.type]
                    .replaceDisplayedVariable(variable.id, derivedVariable);
                timepoint.group(derivedVariable.id);
                this.props.undoRedoStore.saveTimepointHistory('GROUP', variable.id, timepoint.type, timepoint.localIndex);
            });
        } else {
            timepoint.group(variable.id);
            this.props.undoRedoStore.saveTimepointHistory('GROUP', variable.id, timepoint.type, timepoint.localIndex);
        }
    }


    /**
     * ungoups a grouped timepoint
     * @param {SingleTimepoint} timepoint - timepoint to be regrouped
     * @param {string} variableId - variable which will be the future primary variable
     */
    unGroup(timepoint, variableId) {
        timepoint.unGroup(variableId);
        this.props.undoRedoStore.saveTimepointHistory('UNGROUP', variableId, timepoint.type, timepoint.localIndex);
    }

    /**
     * promotes a variable at a timepoint to a primary variable
     * @param {SingleTimepoint} timepoint - timepoint of which the primary variable is changed
     * @param {(DerivedVariable|OriginalVariable)} variable
     */
    promote(timepoint, variable) {
        if (timepoint.isGrouped && variable.datatype === 'NUMBER') {
            this.props.openBinningModal(variable, (derivedVariable) => {
                this.props.rootStore.dataStore.variableStores[timepoint.type]
                    .replaceDisplayedVariable(variable.id, derivedVariable);
                timepoint.promote(derivedVariable.id);
                this.props.undoRedoStore.saveTimepointHistory('PROMOTE', variable.id, timepoint.type, timepoint.localIndex);
            });
        } else {
            timepoint.promote(variable.id);
            this.props.undoRedoStore.saveTimepointHistory('PROMOTE', variable.id, timepoint.type, timepoint.localIndex);
        }
    }

    /**
     *
     * @param {(DerivedVariable|OriginalVariable)} variable
     * @param {string} type
     */
    removeVariable(variable, type) {
        const variableName = variable.name;
        if (variable.derived) {
            this.openSaveModal(variable, (save) => {
                this.props.rootStore.dataStore.variableStores[type]
                    .updateSavedVariables(variable.id, save);
                this.props.rootStore.dataStore.variableStores[type].removeVariable(variable.id);
                this.props.undoRedoStore.saveVariableHistory('REMOVE', variableName, true);
            });
        } else {
            this.props.rootStore.dataStore.variableStores[type].removeVariable(variable.id);
            this.props.undoRedoStore.saveVariableHistory('REMOVE', variableName, true);
        }
    }

    /**
     * highlights variable
     * @param {string} variableId
     */
    handleRowEnter(variableId) {
        this.props.highlightVariable(variableId);
    }

    /**
     * unhighlights variable for deletion and hides tooltip
     */
    handleRowLeave() {
        this.props.unhighlightVariable();
    }

    /**
     * handles click on delete button
     * @param {(OriginalVariable|DerivedVariable)} variable
     * @param {SingleTimepoint} timepoint
     */
    handleDelete(variable, timepoint) {
        this.props.unhighlightVariable();
        this.props.hideTooltip();
        if (timepoint.type === 'between' || this.props.rootStore.dataStore.variableStores[timepoint.type].currentVariables.length > 1) {
            this.removeVariable(variable, timepoint.type);
        } else {
            alert('Samples have to be represented by at least one variable');
        }
    }

    render() {
        return (
            <g transform={this.props.transform}>
                {this.getRaelign()}
                {this.getRowOperator()}
                {this.state.modalIsOpen ? (
                    <SaveVariableDialog
                        modalIsOpen={this.state.modalIsOpen}
                        variable={this.state.currentVariable}
                        callback={this.state.callback}
                        closeModal={() => this.setState({ modalIsOpen: false })}
                    />
                ) : null}
            </g>
        );
    }
}));
RowOperator.propTypes = {
    timepoint: PropTypes.instanceOf(SingleTimepoint).isRequired,
    width: PropTypes.number.isRequired,
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
    showContextMenu: PropTypes.func.isRequired,
    highlightVariable: PropTypes.func.isRequired,
    unhighlightVariable: PropTypes.func.isRequired,
    openBinningModal: PropTypes.func.isRequired,
    transform: PropTypes.string.isRequired,
};
export default RowOperator;
