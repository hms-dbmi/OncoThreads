/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import ReactDOM from "react-dom";
import {observer} from 'mobx-react';
import Modal from "react-modal";

import SampleVariableSelector from "./VariableSelector/SampleVariableSelector"
import BetweenSampleVariableSelector from "./VariableSelector/BetweenSampleVariableSelector"
import MainView from "./MainView"
import ContinuousBinner from "./Binner/ContinuousBinner"


const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        height: '450px',
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
            sideBarVisible: true
    }
        ;
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
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

    componentDidMount() {
        Modal.setAppElement(ReactDOM.findDOMNode(this));
    }


    render() {
        return (
            [<nav id="sidebar" key="sidebar" className="panel-collapse collapse col-md-2 d-none d-md-block bg-light sidebar">
                <div className="sidebar-sticky">
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
                <main key="main" className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4" role="main">
                    <div className="heatmapContainer">
                        <MainView
                            currentVariables={this.props.rootStore.timepointStore.currentVariables}
                            timepoints={this.props.rootStore.timepointStore.timepoints}
                            store={this.props.rootStore.timepointStore}
                            transitionStore={this.props.rootStore.transitionStore}
                            visMap={this.props.rootStore.visStore}
                            openBinningModal={this.openModal}
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
                </Modal>]
        )
    }
});

export default Content;

