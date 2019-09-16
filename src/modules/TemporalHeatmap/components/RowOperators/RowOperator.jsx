import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import SaveVariableDialog from '../Modals/SaveVariableDialog';
import SingleTimepoint from '../../stores/SingleTimepoint';
import UtilityFunctions from '../../UtilityClasses/UtilityFunctions';


/**
 * Component for row operators of one timepoint in BlockView
 */
const RowOperator = inject('rootStore', 'uiStore', 'undoRedoStore')(observer(class RowOperator extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            modalIsOpen: false,
            callback: '',
            currentVariable: '',
        };
        this.iconScale = (props.rootStore.visStore.secondaryHeight) / 24;
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
                <path fill="gray" d="M20,3.43v2.5H0V3.43ZM-.06,14.07v2.5h10v-2.5ZM0,8.75v2.5H15V8.75Z" />
                <rect
                    onClick={() => this.sortTimepoint(timepoint, variable)}
                    onContextMenu={e => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, 'SORT')}
                    width={this.iconDimensions}
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
                    d="M20,20H0V0H20ZM7.16,1H1V19H7.16Z"
                />
                <rect
                    onClick={() => this.group(timepoint, variable)}
                    onContextMenu={e => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, 'GROUP')}
                    width={this.iconDimensions}
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
                    d="M20,20H0V0H20ZM7.33,0h-2V20h2Zm7.33,0h-2V20h2ZM4.33,1H1V19H4.33Z"
                />
                <rect
                    onClick={() => this.unGroup(timepoint, variable.id)}
                    onContextMenu={e => this.props.showContextMenu(e, timepoint.globalIndex, variable.id, 'UNGROUP')}
                    width={this.iconDimensions}
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
                    d="M12.12,10,20,17.87,17.87,20,10,12.12,2.13,20,0,17.87,7.88,10,0,2.13,2.13,0,10,7.88,17.87,0,20,2.13Z"
                />
                <rect
                    onClick={() => this.handleDelete(variable, timepoint)}
                    width={this.iconDimensions}
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
                    {UtilityFunctions.cropText(variable.name, fontSize, fontWeight, width)}
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
                    transform="translate(0,2)"
                    d="M20,12.66H18.34V20h-2V12.66H14.67V7.33h1.67V0h2V7.33H20ZM3.75,0h-2V7.33H0v5.33H1.75V20h2V12.66H5.33V7.33H3.75Zm7.37,0h-2V7.33H7.34v5.33H9.12V20h2V12.66h1.54V7.33H11.12Z"
                    // alternative: d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"
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
