/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import {inject, observer, Provider} from 'mobx-react';
import {Button, ButtonGroup, ButtonToolbar, Col, DropdownButton, Grid, MenuItem, Row} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import MainView from "./MainView"
import GroupBinningModal from "./VariableModals/ModifySingleVariable/Binner/GroupBinningModal"
import Tooltip from "./Tooltip";
import ContextMenus from "./RowOperators/ContextMenus";
import QuickAddVariable from "./VariableSelector/QuickAddVariable"

import ContextMenuHeatmapRow from "./ContextMenuHeatmapRow";

import AddVarModal from "./VariableModals/AddVarModal";

/*
Creates all components except for the top navbar
 */
const Content = inject("rootStore","undoRedoStore")(observer(class Content extends React.Component {
    constructor() {
        super();
        this.state = {
            modalIsOpen: false,
            callback: null,
            clickedVariable: "",
            clickedTimepoint: -1,
            x: 0,
            y: 0,
            showTooltip: "hidden",
            contextType: "",
            showContextMenuHeatmapRow: false,
            addModalIsOpen: false
        }
        ;
        this.openModal = this.openModal.bind(this);
        this.openAddModal = this.openAddModal.bind(this);


        this.closeModal = this.closeModal.bind(this);
        this.closeAddModal = this.closeAddModal.bind(this);

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
     * Opens the modal window and sets the state parameters which are passed to the ContinousBinner
     * @param variable: future primary variable
     * @param type: type of timepoint (sample/between)
     * @param callback: Function which should be executed after the binning was applied: either group or promote
     */
    openModal(variable, type, callback) {
        this.setState({
            modalIsOpen: true,
            clickedVariable: variable,
            type: type,
            callback: callback,
        });
    }


    closeModal() {
        this.setState({modalIsOpen: false, variable: "", timepointIndex: -1, callback: null});
    }

    openAddModal() {
        this.setState({
            addModalIsOpen: true,
        });
    }

    closeAddModal() {
        this.setState({addModalIsOpen: false});
    }

    showTooltip(e, line1, line2) {
        this.setState({
            showTooltip: "visible",
            x: e.pageX,
            y: e.pageY,
            line1: line1,
            line2: line2
        })
    }

    hideTooltip() {
        this.setState({
            showTooltip: "hidden",
        })
    }

    showContextMenu(e, timepointIndex, variable, type) {
        this.setState({
            x: e.pageX,
            y: e.pageY,
            clickedTimepoint: timepointIndex,
            clickedVariable: variable,
            contextType: type,
        });
        e.preventDefault();
    }


    showContextMenuHeatmapRow(e, patient, timepoint, xposition) {
        this.setState({
            x: e.pageX,
            y: e.pageY,
            showContextMenuHeatmapRow: true,
            patient: patient,
            timepoint: timepoint,
            xposition: xposition
        });
        e.preventDefault();
    }

    hideContextMenu() {
        this.setState({
            contextType: "",
            showContextMenuHeatmapRow: false
        })
    }

    /**
     * resets everything
     */
    handleResetAll() {
        this.props.rootStore.reset();
    }

    /**
     * resets timpoint and eventblock structure
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
     * gets binning modal
     * @returns {*}
     */
    getBinner() {
        if (this.state.modalIsOpen) {
            return (
                <GroupBinningModal
                    modalIsOpen={this.state.modalIsOpen}
                    variable={this.state.clickedVariable}
                    callback={this.state.callback}
                    closeModal={this.closeModal}/>);
        }
        else {
            return null;
        }
    }

    /**
     * updates the currently selected variable
     * @param variable
     */
    updateVariable(variable) {
        this.setState({clickedVariable: variable});
    }

    /**
     * gets modal for variable manager
     * @returns {*}
     */
    getVariableManager() {
        if (this.state.addModalIsOpen) {
            return (<AddVarModal
                addModalIsOpen={this.state.addModalIsOpen}
                closeAddModal={this.closeAddModal}
                openBinningModal={this.openModal}
                clinicalSampleCategories={this.props.rootStore.clinicalSampleCategories}
                clinicalPatientCategories={this.props.rootStore.clinicalPatientCategories}
            />);
        }
        else {
            return null;
        }
    }


    /**
     * gets context Menu to move patient(s) up or down
     * @returns {*}
     */
    getContextMenuHeatmapRow() {
        if (this.state.showContextMenuHeatmapRow) {
            return (<ContextMenuHeatmapRow showContextMenuHeatmapRow={this.state.showContextMenuHeatmapRow}
                                           contextX={this.state.x}
                                           contextY={this.state.y}
                                           patient={this.state.patient}
                                           timepoint={this.state.timepoint}
                                           xposition={this.state.xposition}

            />);
        } else {
            return null;
        }
    }


    render() {
        const tooltipFunctions = {
            showTooltip: this.showTooltip,
            hideTooltip: this.hideTooltip,
        };
        return (
            <div>
                <Grid fluid={true} style={{paddingLeft: 20}}>
                    <Row>
                        <Col smOffset={1} xsOffset={1} sm={1} xs={1}>
                            <h5>Add Variables</h5>
                        </Col>
                        <Col md={7} xs={7}>
                            <QuickAddVariable/>
                        </Col>
                        <Col sm={3} xs={3}>
                            <ButtonToolbar>
                                <ButtonGroup>
                                    <Button color="secondary"
                                            onClick={this.openAddModal}>Variable manager
                                    </Button>
                                </ButtonGroup>
                                <ButtonGroup>
                                    <DropdownButton
                                        title={"Zoom"}
                                        key={"zoom"}
                                        id={"zoom"}
                                    >
                                        <div style={{padding: "5px"}}>
                                            Horizontal: <input type="range"
                                                               value={this.props.rootStore.visStore.horizontalZoom}
                                                               onChange={(e) => this.props.rootStore.visStore.setHorizontalZoom(parseInt(e.target.value, 10))}
                                                               step={1}
                                                               min={0} max={290}/>
                                            <Button onClick={this.props.rootStore.visStore.fitToScreenWidth}>Set to
                                                screen width</Button>
                                            <br/>
                                            Vertical: <input type="range"
                                                             value={this.props.rootStore.visStore.transitionSpace}
                                                             onChange={(e) => this.props.rootStore.visStore.setTransitionSpace(parseInt(e.target.value, 10))}
                                                             step={1}
                                                             min={5} max={700}/>
                                            <Button onClick={this.props.rootStore.visStore.fitToScreenHeight}>Set to
                                                screen height</Button>
                                        </div>
                                    </DropdownButton>
                                </ButtonGroup>
                                <ButtonGroup>
                                    <DropdownButton
                                        title={"Reset"}
                                        key={"ResetButton"}
                                        id={"ResetButton"}
                                    >
                                        <MenuItem eventKey="1" onClick={this.handleResetAlignment}>...timepoint
                                            alignment</MenuItem>
                                        <MenuItem eventKey="2"
                                                  onClick={this.handleResetSelection}>...selection</MenuItem>
                                        <MenuItem eventKey="3" onClick={this.handleResetAll}>...all</MenuItem>
                                    </DropdownButton>
                                    <Button onClick={this.props.undoRedoStore.undo}><FontAwesome
                                        name="undo"/></Button>
                                    <Button onClick={this.props.undoRedoStore.redo}><FontAwesome
                                        name="redo"/></Button>

                                </ButtonGroup>
                            </ButtonToolbar>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={12} md={12}
                             onMouseEnter={this.hideContextMenu}
                             style={{paddingTop: 0}}>
                            <Row>
                                <MainView
                                    tooltipFunctions={tooltipFunctions}
                                    openBinningModal={this.openModal}
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
                <Tooltip key="tooltip" visibility={this.state.showTooltip} x={this.state.x}
                         y={this.state.y} line1={this.state.line1} line2={this.state.line2}/>
                <Provider dataStore={this.props.rootStore.dataStore}>
                <ContextMenus key="contextMenu" showContextMenu={this.showContextMenu}
                              hideContextMenu={this.hideContextMenu} contextX={this.state.x}
                              contextY={this.state.y} clickedTimepoint={this.state.clickedTimepoint}
                              clickedVariable={this.state.clickedVariable}
                              type={this.state.contextType}
                              openBinningModal={this.openModal}/>
                </Provider>


            </div>
        )
    }
}));

export default Content;

