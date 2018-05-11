/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import ReactDOM from "react-dom";
import {observer} from 'mobx-react';
import Modal from "react-modal";
import FontAwesome from 'react-fontawesome';

import SampleVariableSelector from "./VariableSelector/SampleVariableSelector"
import BetweenSampleVariableSelector from "./VariableSelector/BetweenSampleVariableSelector"
import MainView from "./MainView"
import ContinuousBinner from "./Binner/ContinuousBinner"
import StudySummary from "./StudySummary";
import Tooltip from "./Tooltip";
import ContextMenus from "./RowOperators/ContextMenus";


const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        height: '550px',
        width: '500px',
        transform: 'translate(-50%, -50%)',
        overlfow: 'scroll'
    }
};
const Content = observer(class Content extends React.Component {
    constructor() {
        super();
        this.state = {
            modalIsOpen: false,
            followUpFunction: null,
            clickedVariable: "",
            clickedTimepoint: -1,
            x:0,
            y:0,
            tooltipContent:"",
            showTooltip:"hidden",
            contextType: ""
        }
        ;
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.showTooltip = this.showTooltip.bind(this);
        this.hideTooltip = this.hideTooltip.bind(this);
        this.showContextMenu=this.showContextMenu.bind(this);
        this.hideContextMenu=this.hideContextMenu.bind(this);
    }

    /**
     * Opens the modal window and sets the state parameters which are passed to the ContinousBinner
     * @param timepointIndex: index of timepoint
     * @param variable: future primary variable
     * @param type: type of timepoint (sample/between)
     * @param fun: Function which should be executed after the binning was applied: either group or promote
     */
    openModal(variable, type, fun, timepointIndex) {
        this.setState({
            modalIsOpen: true,
            clickedTimepoint: timepointIndex,
            clickedVariable: variable,
            type: type,
            followUpFunction: fun
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
            contextType: type
        });
        e.preventDefault();
    }

    hideContextMenu() {
        this.setState({
            contextType: "",
        })
    }
       createTimeButton() {
        const _self = this;
        if (this.props.rootStore.timepointStore.timepoints.length === 0||this.props.rootStore.timepointStore.currentVariables.between.length>0) {
            return null;
        } else {
            return (
                <div>
                    <button className="btn" onClick={(e) => _self.handleTimeClick(e)}
                            key={this.props.rootStore.realTime}>
                        <FontAwesome name="clock"/> {(this.props.rootStore.realTime) ? "Hide actual timeline" : "Show actual timeline"}
                    </button>
                </div>
            )
        }
    }
    handleTimeClick(event) {
        this.props.rootStore.timepointStore.applySortingToAll(0);
        this.props.rootStore.realTime = !this.props.rootStore.realTime;
        event.target.className = (this.props.rootStore.realTime) ? "selected" : "notSelected";
    }

    componentDidMount() {
        Modal.setAppElement(ReactDOM.findDOMNode(this));
    }


    render() {
        return (
            [<nav id="sidebar" key="sidebar"
                  className="panel-collapse collapse col-md-2 d-none d-md-block bg-light sidebar">
                <div className="sidebar-sticky">
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
                </div>
            </nav>,
                <main onMouseEnter={this.hideContextMenu} key="main" className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4" role="main">
                    <button className="btn" onClick={this.props.rootStore.reset}><FontAwesome name="undo"/> Reset</button>
                    {this.createTimeButton()}
                    <div className="heatmapContainer">
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
                        />
                    </div>
                </main>,
                <Modal
                    key="BinModal"
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.afterOpenModal}
                    onRequestClose={this.closeModal}
                    style={customStyles}
                    contentLabel="Bin data"
                >
                    <ContinuousBinner variable={this.state.clickedVariable}
                                      timepointIndex={this.state.clickedTimepoint} type={this.state.type}
                                      followUpFunction={this.state.followUpFunction}
                                      close={this.closeModal} store={this.props.rootStore.timepointStore}
                                      visMap={this.props.rootStore.visStore}/>
                </Modal>,
                <Tooltip key="tooltip" visibility={this.state.showTooltip} x={this.state.x}
                         y={this.state.y} content={this.state.tooltipContent}/>,
                <ContextMenus key="contextMenu" showContextMenu={this.showContextMenu} contextX={this.state.x}
                              contextY={this.state.y} clickedTimepoint={this.state.clickedTimepoint}
                              clickedVariable={this.state.clickedVariable}
                              type={this.state.contextType}
                              store={this.props.rootStore.timepointStore}
                              openBinningModal={this.openModal}/>]
        )
    }
});

export default Content;

