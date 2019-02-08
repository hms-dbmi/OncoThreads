/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import {observer} from 'mobx-react';
import {Button, ButtonGroup, ButtonToolbar, Col, DropdownButton, Grid, MenuItem, Row} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import MainView from "./MainView"
import GroupBinningModal from "./VariableModals/ModifySingleVariable/Binner/GroupBinningModal"
import StudySummary from "./StudySummary";
import Tooltip from "./Tooltip";
import ContextMenus from "./RowOperators/ContextMenus";
import QuickAddVariable from "./VariableSelector/QuickAddVariable"

import ContextMenuHeatmapRow from "./ContextMenuHeatmapRow";

import AddVarModal from "./VariableModals/AddVarModal";

/*
Creates all components except for the top navbar
 */
const Content = observer(class Content extends React.Component {
    constructor(props) {
        super();
        this.state = {
            modalIsOpen: false,
            callback: null,
            clickedVariable: "",
            clickedTimepoint: -1,
            display: false,
            modify: false,
            type: "",
            x: 0,
            y: 0,
            sidebarSize: 0,
            displaySidebar: "none",
            displayShowButton: "",
            tooltipContent: "",
            showTooltip: "hidden",
            contextType: "",
            contextX: 0,
            contextY: 0,
            showContextMenu: false,
            showContextMenuHeatmapRow: false,
            horizontalZoom: 300 - (props.rootStore.dataStore.numberOfPatients < 300 ? props.rootStore.dataStore.numberOfPatients : 300),

            addModalIsOpen: false
            //varList:[]
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

        this.horizontalZoom = this.horizontalZoom.bind(this);
        this.setToScreenWidth = this.setToScreenWidth.bind(this);
        this.verticalZoom = this.verticalZoom.bind(this);
        this.setToScreenHeight = this.setToScreenHeight.bind(this);

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
            contextX: e.pageX,
            contextY: e.pageY,
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

    horizontalZoom(event) {
        this.setState({horizontalZoom: parseInt(event.target.value, 10)});

    }

    verticalZoom(event) {
        this.props.rootStore.visStore.setTransitionSpace(parseInt(event.target.value, 10));
    }

    setToScreenWidth() {
        this.setState({horizontalZoom: 300 - (this.props.rootStore.dataStore.numberOfPatients < 300 ? this.props.rootStore.dataStore.numberOfPatients : 300)})
    }

    setToScreenHeight() {
        this.props.rootStore.visStore.fitToScreenHeight();
    }

    handleResetAll() {
        this.props.rootStore.reset();
    }

    handleResetAlignment() {
        this.props.rootStore.resetTimepointStructure(true);
    }

    handleResetSelection() {
        this.props.rootStore.dataStore.selectedPatients = []
    }


    getBinner() {
        if (this.state.modalIsOpen) {
            return (<GroupBinningModal modalIsOpen={this.state.modalIsOpen}
                                       variable={this.state.clickedVariable}
                                       type={this.state.type}
                                       callback={this.state.callback}
                                       closeModal={this.closeModal} store={this.props.rootStore.dataStore}
                                       visMap={this.props.rootStore.visStore}
            />);
        }
        else {
            return null;
        }
    }


    updateVariable(variable) {
        //this.state.clickedVariable=variable;

        this.setState({clickedVariable: variable});
    }

    getVarListModal() {
        if (this.state.addModalIsOpen) {
            return (<AddVarModal addModalIsOpen={this.state.addModalIsOpen}
                                 closeAddModal={this.closeAddModal}
                                 openBinningModal={this.openModal}
                                 clinicalSampleCategories={this.props.rootStore.clinicalSampleCategories}
                                 clinicalPatientCategories={this.props.rootStore.clinicalPatientCategories}
                                 store={this.props.rootStore.dataStore}
            />);
        }
        else {
            return null;
        }
    }


    getContextMenuHeatmapRow() {
        if (this.state.showContextMenuHeatmapRow) {
            return (<ContextMenuHeatmapRow showContextMenuHeatmapRow={this.state.showContextMenuHeatmapRow}
                                           contextX={this.state.contextX}
                                           contextY={this.state.contextY}
                                           patient={this.state.patient}
                                           timepoint={this.state.timepoint}
                                           xposition={this.state.xposition}
                                           {...this.props}

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
                            <QuickAddVariable
                                clinicalSampleCategories={this.props.rootStore.clinicalSampleCategories}
                                clinicalPatientCategories={this.props.rootStore.clinicalPatientCategories}
                                currentVariables={{
                                        sample: this.props.rootStore.dataStore.variableStores.sample.getCurrentVariables(),
                                        between: this.props.rootStore.dataStore.variableStores.between.getCurrentVariables()
                                    }}
                                availableProfiles={this.props.rootStore.availableProfiles}
                                store={this.props.rootStore.dataStore}
                                eventCategories={this.props.rootStore.eventCategories}
                                eventAttributes={this.props.rootStore.eventAttributes}
                            />
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
                                            Horizontal: <input type="range" value={this.state.horizontalZoom}
                                                               onChange={this.horizontalZoom} step={1}
                                                               min={0} max={290}/>
                                            <Button onClick={this.setToScreenWidth}>Set to screen width</Button>
                                            <br/>
                                            Vertical: <input type="range"
                                                             value={this.props.rootStore.visStore.transitionSpace}
                                                             onChange={this.verticalZoom} step={1}
                                                             min={5} max={700}/>
                                            <Button onClick={this.setToScreenHeight}>Set to screen height</Button>
                                        </div>
                                    </DropdownButton>
                                </ButtonGroup>
                                <ButtonGroup>
                                    {/*<Button onClick={this.props.store.rootStore.exportSVG}>Export
                            </Button>*/}
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
                                    <Button onClick={this.props.rootStore.undoRedoStore.undo}><FontAwesome
                                        name="undo"/></Button>
                                    <Button onClick={this.props.rootStore.undoRedoStore.redo}><FontAwesome
                                        name="redo"/></Button>

                                </ButtonGroup>
                            </ButtonToolbar>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={this.state.sidebarSize} md={this.state.sidebarSize}
                             style={{display: this.state.displaySidebar, paddingTop: 0}}>
                            <StudySummary studyName={this.props.rootStore.study.name}
                                          studyDescription={this.props.rootStore.study.description}
                                          studyCitation={this.props.rootStore.study.citation}
                                          numPatients={this.props.rootStore.patientOrderPerTimepoint.length}
                                          minTP={this.props.rootStore.minTP}
                                          maxTP={this.props.rootStore.maxTP}/>
                        </Col>
                        <Col sm={12 - this.state.sidebarSize} md={12 - this.state.sidebarSize}
                             onMouseEnter={this.hideContextMenu}
                             style={{paddingTop: 0}}>
                            <Row>
                                <MainView
                                    horizontalZoom={this.state.horizontalZoom}

                                    tooltipFunctions={tooltipFunctions}
                                    openBinningModal={this.openModal}
                                    showContextMenu={this.showContextMenu}
                                    hideContextMenu={this.hideContextMenu}
                                    showContextMenuHeatmapRow={this.showContextMenuHeatmapRow}

                                    store={this.props.rootStore.dataStore}
                                    transitionStore={this.props.rootStore.transitionStore}
                                    visMap={this.props.rootStore.visStore}
                                />
                            </Row>
                        </Col>
                    </Row>
                </Grid>
                {this.getBinner()}
                {this.getVarListModal()}
                {this.getContextMenuHeatmapRow()}
                <Tooltip key="tooltip" visibility={this.state.showTooltip} x={this.state.x}
                         y={this.state.y} line1={this.state.line1} line2={this.state.line2}/>
                <ContextMenus key="contextMenu" showContextMenu={this.showContextMenu}
                              hideContextMenu={this.hideContextMenu} contextX={this.state.x}
                              contextY={this.state.y} clickedTimepoint={this.state.clickedTimepoint}
                              clickedVariable={this.state.clickedVariable}
                              type={this.state.contextType}
                              store={this.props.rootStore.dataStore}
                              openBinningModal={this.openModal}/>


            </div>
        )
    }
});

export default Content;

