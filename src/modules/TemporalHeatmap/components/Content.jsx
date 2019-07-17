/**
 * Created by theresa on 30.01.18.
 */
import React from 'react';
import { inject, observer, Provider } from 'mobx-react';
import {
    Button, ButtonGroup, ButtonToolbar, Col, DropdownButton, Grid, MenuItem, Row,
} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import MainView from './MainView';
import GroupBinningModal from './VariableModals/ModifySingleVariable/Binner/GroupBinningModal';
import Tooltip from './Tooltip';
import QuickAddVariable from './VariableSelector/QuickAddVariable';

import ContextMenuHeatmapRow from './ContextMenuHeatmapRow';

import VariableManager from './VariableModals/VariableManager';
import ContextMenu from './RowOperators/ContextMenu';

/**
 * Component containing the view and controls
 */
const Content = inject('rootStore', 'undoRedoStore')(observer(class Content extends React.Component {
    constructor() {
        super();
        this.state = {
            binningModalIsOpen: false,
            callback: null,
            clickedVariable: '',
            clickedTimepoint: -1,
            x: 0,
            y: 0,
            showTooltip: 'hidden',
            contextType: '',
            patient: '',
            showContextMenuHeatmapRow: false,
            variableManagerOpen: false,
        };
        this.openBinningModal = this.openBinningModal.bind(this);
        this.openVariableManager = this.openVariableManager.bind(this);


        this.closeBinningModal = this.closeBinningModal.bind(this);
        this.closeVariableManager = this.closeVariableManager.bind(this);

        this.showTooltip = this.showTooltip.bind(this);
        this.hideTooltip = this.hideTooltip.bind(this);
        this.showContextMenu = this.showContextMenu.bind(this);
        this.hideContextMenu = this.hideContextMenu.bind(this);

        this.handleResetAll = this.handleResetAll.bind(this);
        this.handleResetAlignment = this.handleResetAlignment.bind(this);
        this.handleResetSelection = this.handleResetSelection.bind(this);

        this.updateVariable = this.updateVariable.bind(this);

        this.showContextMenuHeatmapRow = this.showContextMenuHeatmapRow.bind(this);
    }

    /**
     * gets context Menu to move patient(s) up or down
     * @returns {(ContextMenuHeatmapRow|null)}
     */
    getContextMenuHeatmapRow() {
        return (
            <ContextMenuHeatmapRow
                showContextMenu={this.state.showContextMenuHeatmapRow}
                contextX={this.state.x}
                contextY={this.state.y}
                patient={this.state.patient}
                timepoint={this.state.clickedTimepoint}
            />
        );
    }

    /**
     * gets modal for variable manager
     * @returns {(VariableManager|null)}
     */
    getVariableManager() {
        if (this.state.variableManagerOpen) {
            return (
                <VariableManager
                    variableManagerOpen={this.state.variableManagerOpen}
                    closeVariableManager={this.closeVariableManager}
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
        if (this.state.binningModalIsOpen) {
            return (
                <GroupBinningModal
                    modalIsOpen={this.state.binningModalIsOpen}
                    variable={this.state.clickedVariable}
                    callback={this.state.callback}
                    closeModal={this.closeBinningModal}
                />
            );
        }

        return null;
    }

    /**
     * Opens the modal window and sets the state parameters which are passed to GroupBinningModal
     * @param {string} variableId - future primary variable
     * @param {returnDataCallback} callback -  returns the newly derived variable
     */
    openBinningModal(variableId, callback) {
        this.setState({
            binningModalIsOpen: true,
            clickedVariable: variableId,
            callback,
        });
    }

    /**
     * closes binning modal
     */
    closeBinningModal() {
        this.setState({
            binningModalIsOpen: false, variable: '', timepointIndex: -1, callback: null,
        });
    }

    /**
     * opens variable manager
     */
    openVariableManager() {
        this.setState({
            variableManagerOpen: true,
        });
    }

    /**
     * closes variable manager
     */
    closeVariableManager() {
        this.setState({ variableManagerOpen: false });
    }

    /**
     * shows tooltip
     * @param {event}e
     * @param {string} line1
     * @param {string} line2
     */
    showTooltip(e, line1, line2) {
        this.setState({
            showTooltip: 'visible',
            x: e.pageX,
            y: e.pageY,
            line1,
            line2,
        });
    }

    /**
     * hides tooltip
     */
    hideTooltip() {
        this.setState({
            showTooltip: 'hidden',
        });
    }

    /**
     * shows contextMenu
     * @param {event} e
     * @param {number} timepointIndex
     * @param {string} variableId
     * @param {string} type
     */
    showContextMenu(e, timepointIndex, variableId, type) {
        this.setState({
            x: e.pageX,
            y: e.pageY,
            clickedTimepoint: timepointIndex,
            clickedVariable: variableId,
            contextType: type,
        });
        e.preventDefault();
    }

    /**
     * show context menu for moving patients up/down
     * @param {event} e
     * @param {string} patient
     * @param {number} timepointIndex
     */
    showContextMenuHeatmapRow(e, patient, timepointIndex) {
        this.setState({
            x: e.pageX,
            y: e.pageY,
            showContextMenuHeatmapRow: true,
            patient,
            clickedTimepoint: timepointIndex,
        });
        e.preventDefault();
    }

    /**
     * hide context menu for moving patients up/down
     */
    hideContextMenu() {
        this.setState({
            contextType: '',
            showContextMenuHeatmapRow: false,
        });
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

    /**
     * updates the currently selected variable
     * @param {string} variableId
     */
    updateVariable(variableId) {
        this.setState({ clickedVariable: variableId });
    }


    render() {
        const tooltipFunctions = {
            showTooltip: this.showTooltip,
            hideTooltip: this.hideTooltip,
        };
        return (
            <div>
                <Grid fluid style={{ paddingLeft: 20 }}>
                    <Row>
                        <Col smOffset={1} xsOffset={1} md={7} xs={7}>
                            <QuickAddVariable />
                        </Col>
                        <Col sm={4} xs={4}>
                            <ButtonToolbar>
                                <ButtonGroup>
                                    <Button
                                        color="secondary"
                                        onClick={this.openVariableManager}
                                    >
                                        Variable manager
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
                                                value={this.props.rootStore
                                                    .visStore.transitionSpace}
                                                onChange={e => this.props.rootStore
                                                    .visStore.setTransitionSpace(parseInt(
                                                        e.target.value, 10,
                                                    ))}
                                                step={1}
                                                min={5}
                                                max={700}
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
                                            ...timepoint
                                            alignment
                                        </MenuItem>
                                        <MenuItem
                                            eventKey="2"
                                            onClick={this.handleResetSelection}
                                        >
                                            ...selection
                                        </MenuItem>
                                        <MenuItem eventKey="3" onClick={this.handleResetAll}>...all</MenuItem>
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
                    <Row>
                        <Col
                            sm={12}
                            md={12}
                            onMouseEnter={this.hideContextMenu}
                            style={{ paddingTop: 0 }}
                        >
                            <Row>
                                <MainView
                                    tooltipFunctions={tooltipFunctions}
                                    openBinningModal={this.openBinningModal}
                                    showContextMenu={this.showContextMenu}
                                    hideContextMenu={this.hideContextMenu}
                                    showContextMenuHeatmapRow={this.showContextMenuHeatmapRow}
                                />
                            </Row>
                        </Col>
                    </Row>
                </Grid>
                {this.getBinner()}
                {this.getVariableManager()}
                {this.getContextMenuHeatmapRow()}
                <Tooltip
                    key="tooltip"
                    visibility={this.state.showTooltip}
                    x={this.state.x}
                    y={this.state.y}
                    line1={this.state.line1}
                    line2={this.state.line2}
                />
                {this.state.contextType !== '' ? (
                    <Provider dataStore={this.props.rootStore.dataStore}>
                        <ContextMenu
                            action={this.state.contextType}
                            contextX={this.state.x}
                            contextY={this.state.y}
                            clickedVariable={this.state.clickedVariable}
                            clickedTimepoint={this.state.clickedTimepoint}
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
