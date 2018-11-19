/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import {observer} from 'mobx-react';
import {Button, Col, Grid, Row} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import MainView from "./MainView"
import GroupBinningModal from "./VariableModals/Binner/GroupBinningModal"
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
    constructor() {
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
        this.showSidebar = this.showSidebar.bind(this);
        this.hideSidebar = this.hideSidebar.bind(this);

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

    showSidebar() {
        this.setState({sidebarSize: 2, displaySidebar: "", displayShowButton: "none"})
    }

    hideSidebar() {
        this.setState({sidebarSize: 0, displaySidebar: "none", displayShowButton: ""})
    }

    getBinner() {
        if (this.state.modalIsOpen) {
            return (<GroupBinningModal modalIsOpen={this.state.modalIsOpen}
                                       variable={this.state.clickedVariable}
                                       type={this.state.type}
                                       callback={this.state.callback}
                                       closeModal={this.closeModal} store={this.props.rootStore.timepointStore}
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
                                 store={this.props.rootStore.timepointStore}
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
        return (
            <div>
                <Grid fluid={true} style={{paddingLeft:20}}>
                    <Row>
                        <Col sm={1} xs={1}>
                            <h5>Add Variables</h5>
                        </Col>
                        <Col md={9} xs={9}>
                            <QuickAddVariable
                                clinicalSampleCategories={this.props.rootStore.clinicalSampleCategories}
                                clinicalPatientCategories={this.props.rootStore.clinicalPatientCategories}
                                molecularProfiles={this.props.rootStore.cbioAPI.molecularProfiles}
                                availableProfiles={this.props.rootStore.availableProfiles}
                                store={this.props.rootStore.timepointStore}
                                eventCategories={this.props.rootStore.eventCategories}
                                eventAttributes={this.props.rootStore.eventAttributes}
                            />
                        </Col>
                        <Col sm={2} xs={2}>
                            <Button color="secondary"
                                    onClick={this.openAddModal}>Variable manager
                            </Button>
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
                                    currentVariables={{
                                        sample: this.props.rootStore.timepointStore.variableStores.sample.getCurrentVariables(),
                                        between: this.props.rootStore.timepointStore.variableStores.between.getCurrentVariables()
                                    }}
                                    timepoints={this.props.rootStore.timepointStore.timepoints}
                                    store={this.props.rootStore.timepointStore}
                                    transitionStore={this.props.rootStore.transitionStore}
                                    visMap={this.props.rootStore.visStore} f
                                    rectWidth={this.props.rootStore.visStore.sampleRectWidth}
                                    openBinningModal={this.openModal}
                                    showTooltip={this.showTooltip}
                                    hideTooltip={this.hideTooltip}
                                    showContextMenu={this.showContextMenu}
                                    hideContextMenu={this.hideContextMenu}
                                    showContextMenuHeatmapRow={this.showContextMenuHeatmapRow}
                                    sidebarVisible={this.state.sidebarSize === 2}/>
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
                              store={this.props.rootStore.timepointStore}
                              openBinningModal={this.openModal}/>


            </div>
        )
    }
});

export default Content;

