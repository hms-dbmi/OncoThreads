import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';
import { Tab, Tabs } from 'react-bootstrap';
import GlobalTimeline from './GlobalTimeline';
import BlockView from './BlockView';
import MyBlockView from './BlockViewNew';
import StateTransition from './StateTransition'
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

/**
 * Component containing the main visualization
 */
const MainView = inject('rootStore', 'uiStore', 'undoRedoStore')(observer(class MainView extends React.Component {
    constructor(props) {
        super(props);
        this.handleSwitchView = this.handleSwitchView.bind(this);
    }

    /**
     * handles switching to global timeline and back
     * @param {boolean} key - global timeline (true) or block view (false)
     */
    handleSwitchView(key) {
        if (key !== this.props.uiStore.globalTime) {
            this.props.uiStore.setGlobalTime(key);
            this.props.undoRedoStore.saveSwitchHistory(this.props.uiStore.globalTime);
        }
    }

    getTabbedPanel() {
        // create  views

        let stateTransition = <StateTransition
            openSaveVarModal={this.props.openSaveVarModal}
            tooltipFunctions={this.props.tooltipFunctions}
        />
        let myblockView = (
            <MyBlockView
                showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                tooltipFunctions={this.props.tooltipFunctions}
                showContextMenu={this.props.showContextMenu}
                openBinningModal={this.props.openBinningModal}
                openSaveVarModal={this.props.openSaveVarModal}
            />
        );
        let timelineView = (
            <GlobalTimeline
                showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                tooltipFunctions={this.props.tooltipFunctions}
                showContextMenu={this.props.showContextMenu}
                openBinningModal={this.props.openBinningModal}
                openSaveVarModal={this.props.openSaveVarModal}
            />
        );
        let blockView = (
            <BlockView
                showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                tooltipFunctions={this.props.tooltipFunctions}
                showContextMenu={this.props.showContextMenu}
                openBinningModal={this.props.openBinningModal}
                openSaveVarModal={this.props.openSaveVarModal}
            />
        );

        let dataIntro = '<h4>To start with, select different views to analyze the clinical sequences from different aspects.</h4>\
        <b>Block View</b> groups patients at each tiempoint based on their values of one selected feature.<br/><br/>\
        <b>State Transition</b>  provides a more advanced analysis and enables state identification using timepoint features.<br/><br/> \
        <b>Timeline View</b> shows the individual clinical sequence of each patient.'
        // let dataIntro = 'Select different views to analyze the clinical sequences from different aspects.'

        return (
            // <Grid fluid className="tabContent">
            <Tabs
                style={{ width: "100%" }}
                mountOnEnter
                unmountOnExit
                animation={false}
                activeKey={this.props.uiStore.globalTime}
                onSelect={
                    this.handleSwitchView
                }
                id="viewTab"

                data-intro={dataIntro}
                data-step='1'
                data-position='right'
            >
                <Tab eventKey='block' style={{ paddingTop: 10 }} title={<span>Block View <Tooltip title="Patients are grouped at each timepoint by their attribute values"><InfoCircleOutlined translate='' /></Tooltip></span>}>
                    {blockView}
                </Tab>

                <Tab eventKey='myblock' style={{ paddingTop: 10 }} title={<span>Block V2 <Tooltip title="Patients are grouped at each timepoint by the identified states"><InfoCircleOutlined translate='' /></Tooltip></span>}>
                    {myblockView}
                </Tab>
                <Tab eventKey='stateTransition' style={{ paddingTop: 10 }}
                    title={<span>State Transitions <Tooltip title="States are identified and the transition among states are presented"><InfoCircleOutlined translate='' /></Tooltip></span>}>
                    {stateTransition}
                </Tab>

                <Tab eventKey='line' style={{ paddingTop: 10 }} title={<span>Timeline <Tooltip title="The timelines of individual patients"><InfoCircleOutlined translate='' /></Tooltip></span>}>
                    {timelineView}
                </Tab>
            </Tabs>
            // </Grid>
        );
    }

    componentDidUpdate() {
        let { uiStore } = this.props

        if (uiStore.globalTime === 'stateTransition' && uiStore.introTutorial !== undefined) {

            uiStore.setTutorialMode(false) // close current tutorial
            uiStore.setTutorialMode(true) // start a new intro to refresh the intro in the newly-opened tab panel
        }
    }



    render() {
        if (this.props.rootStore.dataStore.variableStores.sample.currentVariables.length > 0 ||
            this.props.rootStore.dataStore.variableStores.between.currentVariables.length > 0) {
            return (this.getTabbedPanel())
        }
        else {
            const noDataText = 'No data currently selected. Use "Add" button or "Feature Manager" to select one or more timepoint features';
            return (
                <div style={{ height: this.props.rootStore.visStore.plotHeight }}>
                    <div className='centeredText'>
                        {noDataText}
                    </div>
                </div>
            )
        }
    }
}));
MainView.propTypes = {
    tooltipFunctions: PropTypes.objectOf(PropTypes.func).isRequired,
    showContextMenu: PropTypes.func.isRequired,
    showContextMenuHeatmapRow: PropTypes.func.isRequired,
    openBinningModal: PropTypes.func.isRequired,
    openSaveVarModal: PropTypes.func.isRequired,
};
export default MainView;
