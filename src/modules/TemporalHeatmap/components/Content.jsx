/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import {observer} from 'mobx-react';
import {Button, Col, Grid, Row} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';

import SampleVariableSelector from "./VariableSelector/SampleVariableSelector"
import BetweenSampleVariableSelector from "./VariableSelector/BetweenSampleVariableSelector"
import MainView from "./MainView"
import ContinuousBinner from "./Binner/ContinuousBinner"
import StudySummary from "./StudySummary";
import Tooltip from "./Tooltip";
import ContextMenus from "./RowOperators/ContextMenus";

import ContextMenuHeatmapRow from "./ContextMenuHeatmapRow";

import AddVarModal from "./Modals/AddVarModal";

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
            type: "",
            x: 0,
            y: 0,
            sidebarSize: 2,
            displaySidebar: "",
            displayShowButton: "none",
            tooltipContent: "",
            showTooltip: "hidden",
            contextType: "",
            contextX: 0,
            contextY: 0,
            showContextMenu: false,
            showContextMenuHeatmapRow: false,

            addModalIsOpen: false,
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

        this.updateVariable=this.updateVariable.bind(this);

        this.showContextMenuHeatmapRow = this.showContextMenuHeatmapRow.bind(this);
    }

    /**
     * Opens the modal window and sets the state parameters which are passed to the ContinousBinner
     * @param timepointIndex: index of timepoint
     * @param variable: future primary variable
     * @param type: type of timepoint (sample/between)
     * @param callback: Function which should be executed after the binning was applied: either group or promote
     */
    openModal(variable, type, timepointIndex, callback) {
        this.setState({
            modalIsOpen: true,
            clickedTimepoint: timepointIndex,
            clickedVariable: variable,
            type: type,
            callback: callback,
        });
    }


    closeModal() {
        this.setState({modalIsOpen: false, variable: "", timepointIndex: -1, callback: null});
    }

    openAddModal() {
        //let data = this.props.rootStore.timepointStore.getAllValues(variable);
        this.setState({
            addModalIsOpen: true,
            // clickedTimepoint: timepointIndex,
            // clickedVariable: variable,
            // type: type,
            // followUpFunction: fun,
            // binningData: data,
        });

        console.log("In openAddModal()");
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
            return (<ContinuousBinner modalIsOpen={this.state.modalIsOpen}
                                      variable={this.state.clickedVariable}
                                      timepointIndex={this.state.clickedTimepoint} type={this.state.type}
                                      callback={this.state.callback}
                                      closeModal={this.closeModal} store={this.props.rootStore.timepointStore}
                                      visMap={this.props.rootStore.visStore}
            />);
        }
        else {
            return null;
        }
    }


    updateVariable(variable){
        //this.state.clickedVariable=variable;

        this.setState({clickedVariable: variable});
        console.log(this.state.clickedVariable);
    }
    getVarListModal() {
        if (this.state.addModalIsOpen) {
            return (<AddVarModal addModalIsOpen={this.state.addModalIsOpen}
                                    varList={this.state.varList}
                                    closeAddModal={this.closeAddModal}
                                    currentVariables={this.props.rootStore.timepointStore.currentVariables.sample}
                                    showTooltip={this.showTooltip}
                                    hideTooltip={this.hideTooltip}
                                    store={this.props.rootStore.sampleTimepointStore} 
                                    variable={this.state.clickedVariable}
                                    updateVariable={this.updateVariable}
                                    openBinningModal={this.openModal}
                                    //store={this.props.rootStore.timepointStore}
                                    //visMap={this.props.rootStore.visStore}
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

    getToggleSidebarIcons() {
        if (this.state.displayShowButton !== "none") {
            return <Button onClick={this.showSidebar}><FontAwesome
                name="bars"/></Button>
        }
        else {
            return <Button style={{float: 'right'}}
                           onClick={this.hideSidebar}><FontAwesome name="times"/></Button>
        }
    }


    render() {
        return (
            <div>
                <Grid fluid={true}>
                    <Row>
                        <Col sm={2} xs={2}>
                            {this.getToggleSidebarIcons()}
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
                            <SampleVariableSelector
                                openBinningModal={this.openModal}
                                openAddModal={this.openAddModal}
                                clinicalSampleCategories={this.props.rootStore.clinicalSampleCategories}
                                mutationCount="Mutation count"
                                currentVariables={this.props.rootStore.timepointStore.variableStores.sample.getCurrentVariables()}
                                showTooltip={this.showTooltip}
                                hideTooltip={this.hideTooltip}
                                store={this.props.rootStore.timepointStore.variableStores.sample}
                                visMap={this.props.rootStore.visStore}
                            />
                            <BetweenSampleVariableSelector
                                openBinningModal={this.openModal}
                                eventCategories={this.props.rootStore.eventCategories}
                                eventAttributes={this.props.rootStore.eventAttributes}
                                currentVariables={this.props.rootStore.timepointStore.variableStores.between.getCurrentVariables()}
                                store={this.props.rootStore.timepointStore.variableStores.between}
                                visMap={this.props.rootStore.visStore}
                            />
                        </Col>
                        <Col sm={12 - this.state.sidebarSize} md={12 - this.state.sidebarSize}
                             onMouseEnter={this.hideContextMenu}
                             style={{padding: 20}}>
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

