/**
 * Created by theresa on 30.01.18.
 */
import React from 'react';
import { inject, observer, Provider } from 'mobx-react';
import {
    Button, ButtonGroup, ButtonToolbar, Col, DropdownButton, Grid, MenuItem, Row,
} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { extendObservable } from 'mobx';
import MainView from './MainView';
import CustomGrouping from './CustomGrouping'
import GroupBinningModal from './VariableModals/ModifySingleVariable/Binner/GroupBinningModal';
import Tooltip from './Tooltip';
import QuickAddVariable from './VariableSelector/QuickAddVariable';

import ContextMenuHeatmapRow from './ContextMenuHeatmapRow';

import VariableManager from './VariableModals/VariableManager';
import ContextMenu from './RowOperators/ContextMenu';
import SaveVariableDialog from './Modals/SaveVariableDialog';


/**
 * Component containing the view and controls
 */
const Content = inject('rootStore', 'undoRedoStore')(observer(class Content extends React.Component {
    constructor() {
        super();
        extendObservable(this, {
            binningModalIsOpen: false,
            saveModalIsOpen: false,
            callback: null,
            clickedVariable: '',
            clickedTimepoint: -1,
            clickedPatient: '',
            x: 0,
            y: 0,
            tooltipVisibility: 'hidden',
            contextMenuType: '',
            moveMenuVisibility: false,
            variableManagerOpen: false,
        });
        this.openBinningModal = this.openBinningModal.bind(this);
        this.openSaveVarModal = this.openSaveVarModal.bind(this);
        this.openVariableManager = this.openVariableManager.bind(this);

        this.closeBinningModal = this.closeBinningModal.bind(this);
        this.closeSaveModal = this.closeSaveModal.bind(this);
        this.closeVariableManager = this.closeVariableManager.bind(this);

        this.showTooltip = this.showTooltip.bind(this);
        this.hideTooltip = this.hideTooltip.bind(this);
        this.showContextMenu = this.showContextMenu.bind(this);
        this.hideContextMenu = this.hideContextMenu.bind(this);

        this.handleResetAll = this.handleResetAll.bind(this);
        this.handleResetAlignment = this.handleResetAlignment.bind(this);
        this.handleResetSelection = this.handleResetSelection.bind(this);

        this.showContextMenuHeatmapRow = this.showContextMenuHeatmapRow.bind(this);

        this.tooltipFunctions = {
            showTooltip: this.showTooltip,
            hideTooltip: this.hideTooltip,
        };
    }

    /**
     * gets context Menu to move patient(s) up or down
     * @returns {(ContextMenuHeatmapRow|null)}
     */
    getContextMenuHeatmapRow() {
        return (
            <ContextMenuHeatmapRow
                showContextMenu={this.moveMenuVisibility}
                contextX={this.x}
                contextY={this.y}
                patient={this.clickedPatient}
                timepoint={this.clickedTimepoint}
            />
        );
    }

    /**
     * gets modal for variable manager
     * @returns {(VariableManager|null)}
     */
    getVariableManager() {
        if (this.variableManagerOpen) {
            return (
                <VariableManager
                    variableManagerOpen={this.variableManagerOpen}
                    closeVariableManager={this.closeVariableManager}
                    openSaveVarModal={this.openSaveVarModal}
                />
            );
        }

        return null;
    }

    /**
     * gets binning modal
     * @returns {(GroupBinningModal|null)}
     */
    getBinner() {
        if (this.binningModalIsOpen) {
            return (
                <GroupBinningModal
                    modalIsOpen={this.binningModalIsOpen}
                    variable={this.clickedVariable}
                    callback={this.callback}
                    closeModal={this.closeBinningModal}
                />
            );
        }

        return null;
    }

    /**
     * gets the modal for saving variables
     * @return {(SaveVariableDialog|null)}
     */
    getSaveModal() {
        if (this.saveModalIsOpen) {
            return (
                <SaveVariableDialog
                    modalIsOpen={this.saveModalIsOpen}
                    variable={this.clickedVariable}
                    callback={this.callback}
                    closeModal={this.closeSaveModal}
                />
            );
        }

        return null;
    }

    /**
     * Opens the modal window and sets the state parameters which are passed to GroupBinningModal
     * @param {OriginalVariable} variable - future primary variable
     * @param {returnDataCallback} callback -  returns the newly derived variable
     */
    openBinningModal(variable, callback) {
        this.binningModalIsOpen = true;
        this.clickedVariable = variable;
        this.callback = callback;
    }

    /**
     * closes binning modal
     */
    closeBinningModal() {
        this.binningModalIsOpen = false;
        this.variable = '';
        this.callback = null;
    }

    /**
     * Opens the modal window and sets the state parameters which are passed to SaveVariableDialog
     * @param {DerivedVariable} variable - variable to be saved
     * @param {returnDataCallback} callback -  called after saving
     */
    openSaveVarModal(variable, callback) {
        this.saveModalIsOpen = true;
        this.clickedVariable = variable;
        this.callback = callback;
    }

    /**
     * closes save modal
     */
    closeSaveModal() {
        this.saveModalIsOpen = false;
        this.variable = '';
        this.callback = null;
    }

    /**
     * opens variable manager
     */
    openVariableManager() {
        this.variableManagerOpen = true;
    }

    /**
     * closes variable manager
     */
    closeVariableManager() {
        this.variableManagerOpen = false;
    }

    /**
     * shows tooltip
     * @param {event} e
     * @param {string} line1
     * @param {string} line2
     */
    showTooltip(e, line1, line2) {
        this.tooltipVisibility = 'visible';
        this.x = e.pageX;
        this.y = e.pageY;
        this.line1 = line1;
        this.line2 = line2;
    }

    /**
     * hides tooltip
     */
    hideTooltip() {
        this.tooltipVisibility = 'hidden';
    }

    /**
     * shows contextMenu
     * @param {event} e
     * @param {number} timepointIndex
     * @param {string} variableId
     * @param {string} type
     */
    showContextMenu(e, timepointIndex, variableId, type) {
        this.x = e.pageX;
        this.y = e.pageY;
        this.clickedTimepoint = timepointIndex;
        this.clickedVariable = variableId;
        this.contextMenuType = type;
        e.preventDefault();
    }

    /**
     * show context menu for moving patients up/down
     * @param {event} e
     * @param {string} patient
     * @param {number} timepointIndex
     */
    showContextMenuHeatmapRow(e, patient, timepointIndex) {
        this.x = e.pageX;
        this.y = e.pageY;
        this.moveMenuVisibility = true;
        this.clickedPatient = patient;
        this.clickedTimepoint = timepointIndex;
        e.preventDefault();
    }

    /**
     * hide context menu for moving patients up/down
     */
    hideContextMenu() {
        this.contextMenuType = '';
        this.moveMenuVisibility = false;
    }

    /**
     * resets everything
     */
    handleResetAll() {
        this.props.rootStore.reset();
    }

    /**
     * resets timpoint structure
     */
    handleResetAlignment() {
        this.props.rootStore.resetTimepointStructure(true);
    }

    /**
     * resets current selection
     */
    handleResetSelection() {
        this.props.rootStore.dataStore.resetSelection();
    }


    render() {
              
        return (
            <div>
                <Grid fluid style={{ paddingLeft: 20 }}>
                <h4>{this.props.rootStore.study.name}</h4>
                    <Row className='controlPane'>
                        <Col smOffset={0} xsOffset={0} md={7} xs={7}>
                            <QuickAddVariable />
                        </Col>
                        <Col sm={4} xs={4}>
                            <ButtonToolbar>
                                <ButtonGroup>
                                    <Button
                                        color="secondary"
                                        onClick={this.openVariableManager}
                                    >
                                        Feature Manager
                                    </Button>
                                </ButtonGroup>
                                <ButtonGroup>
                                    <DropdownButton
                                        title="Zoom"
                                        key="zoom"
                                        id="zoom"
                                    >
                                        <div style={{ padding: '5px' }}>
                                            Horizontal:
                                            {' '}
                                            <input
                                                type="range"
                                                value={this.props.rootStore.visStore.horizontalZoom}
                                                onChange={e => this.props.rootStore.visStore
                                                    .setHorizontalZoom(parseInt(
                                                        e.target.value, 10,
                                                    ))}
                                                step={1}
                                                min={0}
                                                max={290}
                                            />
                                            <Button onClick={this.props.rootStore
                                                .visStore.fitToScreenWidth}
                                            >
                                                Set to screen width
                                            </Button>
                                            <br />
                                            Vertical:
                                            {' '}
                                            <input
                                                type="range"
                                                value={Math.max(...this.props.rootStore
                                                    .visStore.transitionSpaces)}
                                                onChange={e => this.props.rootStore
                                                    .visStore.setAllTransitionSpaces(parseInt(
                                                        e.target.value, 10,
                                                    ))}
                                                step={1}
                                                min={this.props.rootStore.visStore.minTransHeight}
                                                max={this.props.rootStore.visStore.plotHeight}
                                            />
                                            <Button onClick={this.props.rootStore
                                                .visStore.fitToScreenHeight}
                                            >
                                                Set to screen height
                                            </Button>
                                        </div>
                                    </DropdownButton>
                                </ButtonGroup>
                                <ButtonGroup>
                                    <DropdownButton
                                        title="Reset"
                                        key="ResetButton"
                                        id="ResetButton"
                                    >
                                        <MenuItem eventKey="1" onClick={this.handleResetAlignment}>
                                            timepoint
                                            alignment
                                        </MenuItem>
                                        <MenuItem
                                            eventKey="2"
                                            onClick={this.handleResetSelection}
                                        >
                                            selection
                                        </MenuItem>
                                        <MenuItem eventKey="3" onClick={this.handleResetAll}>all</MenuItem>
                                    </DropdownButton>
                                    <Button onClick={this.props.undoRedoStore.undo}>
                                        <FontAwesome
                                            name="undo"
                                        />
                                    </Button>
                                    <Button onClick={this.props.undoRedoStore.redo}>
                                        <FontAwesome
                                            name="redo"
                                        />
                                    </Button>

                                </ButtonGroup>
                            </ButtonToolbar>
                        </Col>
                    </Row>
                    <Row className='mainVIStab'>
                        <Col className="selectGroup" 
                            sm={3}
                            md={3}>
                                <CustomGrouping 
                                    points={
                                        this.props.rootStore.dataStore.variableStores.sample.points
                                    }
                                    timepoints={
                                        this.props.rootStore.dataStore.variableStores.sample.childStore.timepoints
                                    }
                                    currentVariables={this.props.rootStore.dataStore.variableStores.sample.currentVariables}
                                    referencedVariables = {this.props.rootStore.dataStore.variableStores.sample.referencedVariables}
                                />
                                {/* <CustomGrouping/> */}
                        </Col>
                        <Col
                            sm={9}
                            md={9}
                            onMouseEnter={this.hideContextMenu}
                            style={{ paddingTop: 5 }}
                        >
                            {/* <Row> */}
                                <MainView
                                    tooltipFunctions={this.tooltipFunctions}
                                    openBinningModal={this.openBinningModal}
                                    openSaveVarModal={this.openSaveVarModal}
                                    showContextMenu={this.showContextMenu}
                                    hideContextMenu={this.hideContextMenu}
                                    showContextMenuHeatmapRow={this.showContextMenuHeatmapRow}
                                />
                            {/* </Row> */}
                        </Col>
                    </Row>
                </Grid>
                {this.getBinner()}
                {this.getSaveModal()}
                {this.getVariableManager()}
                {this.getContextMenuHeatmapRow()}
                <Tooltip
                    key="tooltip"
                    visibility={this.tooltipVisibility}
                    x={this.x}
                    y={this.y}
                    line1={this.line1}
                    line2={this.line2}
                />
                {this.contextMenuType !== '' ? (
                    <Provider dataStore={this.props.rootStore.dataStore}>
                        <ContextMenu
                            action={this.contextMenuType}
                            contextX={this.x}
                            contextY={this.y}
                            clickedVariable={this.clickedVariable}
                            clickedTimepoint={this.clickedTimepoint}
                            hideContextMenu={this.hideContextMenu}
                            openBinningModal={this.openBinningModal}
                        />
                    </Provider>
                ) : null}
            </div>
        );
    }
}));

export default Content;
