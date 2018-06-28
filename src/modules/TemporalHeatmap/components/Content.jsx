/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import {observer} from 'mobx-react';
import {Col, Grid, Row} from 'react-bootstrap';

import SampleVariableSelector from "./VariableSelector/SampleVariableSelector"
import BetweenSampleVariableSelector from "./VariableSelector/BetweenSampleVariableSelector"
import MainView from "./MainView"
import ContinuousBinner from "./Binner/ContinuousBinner"
import StudySummary from "./StudySummary";
import Tooltip from "./Tooltip";
import ContextMenus from "./RowOperators/ContextMenus";

import ContextMenuHeatmapRow from "./ContextMenuHeatmapRow";

/*
Creates all components except for the top navbar
 */
const Content = observer(class Content extends React.Component {
    constructor() {
        super();
        this.state = {
            modalIsOpen: false,
            followUpFunction: null,
            clickedVariable: "",
            clickedTimepoint: -1,
            type:"",
            x: 0,
            y: 0,
            sidebarSize: 2,
            mainSize: 10,
            displaySidebar: "",
            displayShowButton: "none",
            tooltipContent: "",
            showTooltip: "hidden",
            contextType: "",
            contextX: 0,
            contextY: 0,
            showContextMenu: false,
            showContextMenuHeatmapRow: false
        }
        ;
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.showTooltip = this.showTooltip.bind(this);
        this.hideTooltip = this.hideTooltip.bind(this);
        this.showContextMenu = this.showContextMenu.bind(this);
        this.hideContextMenu = this.hideContextMenu.bind(this);
        this.showSidebar = this.showSidebar.bind(this);
        this.hideSidebar = this.hideSidebar.bind(this);

        this.showContextMenuHeatmapRow=this.showContextMenuHeatmapRow.bind(this);
    }

    /**
     * Opens the modal window and sets the state parameters which are passed to the ContinousBinner
     * @param timepointIndex: index of timepoint
     * @param variable: future primary variable
     * @param type: type of timepoint (sample/between)
     * @param fun: Function which should be executed after the binning was applied: either group or promote
     */
    openModal(variable, type, fun, timepointIndex) {
        let data = this.props.rootStore.timepointStore.getAllValues(variable);
        this.setState({
            modalIsOpen: true,
            clickedTimepoint: timepointIndex,
            clickedVariable: variable,
            type: type,
            followUpFunction: fun,
            binningData: data,
        });
    }

    closeModal() {
        this.setState({modalIsOpen: false, variable: "", timepointIndex: -1, followUpFunction: null});
    }

    showTooltip(e, content) {
        this.setState({
            showTooltip: "visible",
            x: e.pageX,
            y: e.pageY,
            tooltipContent: content,
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
            //contextX: e.pageX,
            //contextY: e.pageY,
            //showContextMenu: true
        });
        e.preventDefault();
    }

        
    showContextMenuHeatmapRow(e, patient, timepoint, xposition) {
        this.setState({
            contextX: e.pageX,
            contextY: e.pageY,
            showContextMenuHeatmapRow: true,
            patient:patient,
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
        this.setState({sidebarSize: 2, mainSize: 10, displaySidebar: "", displayShowButton: "none"})
    }

    hideSidebar() {
        this.setState({sidebarSize: 0, mainSize: 12, displaySidebar: "none", displayShowButton: ""})
    }
    getBinner(){
        if(this.state.modalIsOpen){
             return(<ContinuousBinner modalIsOpen={this.state.modalIsOpen}
                                  variable={this.state.clickedVariable}
                                  timepointIndex={this.state.clickedTimepoint} type={this.state.type}
                                  followUpFunction={this.state.followUpFunction}
                                  closeModal={this.closeModal} store={this.props.rootStore.timepointStore}
                                  visMap={this.props.rootStore.visStore}
                />);
        }
        else{
            return null;
        }
    }
    /*getContextMenu(){
        if(this.state.showContextMenu){
            var contextMenuStyle = {
                display: 'block',
                position: 'absolute', 
                left: this.state.contextX ? this.state.contextX : 0,
                top: this.state.contextY ? this.state.contextY : 0
            }
            //return(<div id="contextMenu" style={contextMenuStyle}>right clicked</div>);

            return (<div><div className="contextMenu--option">Up</div>
                <div className="contextMenu--option">Down</div>
                </div>);
        } else{
            return null;
        }
    }

    getContextMenuHeatmapRow(){
        if(this.state.showContextMenuHeatmapRow){
            var contextMenuStyle = {
                display: 'block',
                position: 'absolute', 
                left: this.state.contextX ? this.state.contextX : 0,
                top: this.state.contextY ? this.state.contextY : 0
            }
            //return(<div id="contextMenu" style={contextMenuStyle}>right clicked</div>);

            return (<ContextMenuHeatmapRow showContextMenuHeatmapRow={this.state.showContextMenuHeatmapRow}
                contextX={this.state.contextX}
                contextY={this.state.contextY}

            />);
        } else{
            return null;
        }
    }*/


    getContextMenuHeatmapRow(){
        if(this.state.showContextMenuHeatmapRow){
            /*var contextMenuStyle = {
                display: 'block',
                position: 'absolute', 
                left: this.state.contextX ? this.state.contextX : 0,
                top: this.state.contextY ? this.state.contextY : 0
            }*/
            //return(<div id="contextMenu" style={contextMenuStyle}>right clicked</div>);

            //console.log(this.state.patient + ", " + this.state.timepoint + ", " + this.state.y);

            return (<ContextMenuHeatmapRow showContextMenuHeatmapRow={this.state.showContextMenuHeatmapRow}
                contextX={this.state.contextX}
                contextY={this.state.contextY}
                patient={this.state.patient}
                timepoint={this.state.timepoint} 
                xposition={this.state.xposition}
                {...this.props}

            />);
        } else{
            return null;
        }
    }
    


    render() {
        return (
            <div>
                {/*<Button style={{display:this.state.displayShowButton}} onClick={this.showSidebar}>Show Sidebar</Button>*/}
                <Grid fluid={true} style={{padding: 0}}>
                    <Col sm={this.state.sidebarSize} md={this.state.sidebarSize}
                         style={{display: this.state.displaySidebar, backgroundColor: "lightgray", paddingTop: "10px"}}>
                        {/*
                        <Row>
                        <Button style={{float:"right"}} onClick={this.hideSidebar}>X</Button>
                        </Row>
                        */}
                        <StudySummary studyName={this.props.rootStore.study.name}
                                      studyDescription={this.props.rootStore.study.description}
                                      studyCitation={this.props.rootStore.study.citation}
                                      numPatients={this.props.rootStore.patientOrderPerTimepoint.length}
                                      minTP={this.props.rootStore.minTP}
                                      maxTP={this.props.rootStore.maxTP}/>
                        <SampleVariableSelector
                            clinicalSampleCategories={this.props.rootStore.clinicalSampleCategories}
                            mutationCount="Mutation count"
                            currentVariables={this.props.rootStore.timepointStore.currentVariables.sample}
                            store={this.props.rootStore.sampleTimepointStore}
                            visMap={this.props.rootStore.visStore}
                        />
                        <BetweenSampleVariableSelector
                            eventCategories={this.props.rootStore.eventCategories}
                            eventAttributes={this.props.rootStore.eventAttributes}
                            currentVariables={this.props.rootStore.timepointStore.currentVariables.between}
                            store={this.props.rootStore.betweenTimepointStore}
                            visMap={this.props.rootStore.visStore}
                        />
                    </Col>
                    <Col sm={this.state.mainSize} md={this.state.mainSize} onMouseEnter={this.hideContextMenu}
                         style={{padding: 20}}>
                        <Row>
                            <MainView
                                currentVariables={this.props.rootStore.timepointStore.currentVariables}
                                timepoints={this.props.rootStore.timepointStore.timepoints}
                                store={this.props.rootStore.timepointStore}
                                transitionStore={this.props.rootStore.transitionStore}
                                visMap={this.props.rootStore.visStore}
                                openBinningModal={this.openModal}
                                showTooltip={this.showTooltip}
                                hideTooltip={this.hideTooltip}
                                showContextMenu={this.showContextMenu}
                                hideContextMenu={this.hideContextMenu}
                                showContextMenuHeatmapRow={this.showContextMenuHeatmapRow}/>
                        </Row>
                    </Col>
                </Grid>
                {this.getBinner()}
                {this.getContextMenuHeatmapRow()}
                <Tooltip key="tooltip" visibility={this.state.showTooltip} x={this.state.x}
                         y={this.state.y} content={this.state.tooltipContent}/>
                <ContextMenus key="contextMenu" showContextMenu={this.showContextMenu} contextX={this.state.x}
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

