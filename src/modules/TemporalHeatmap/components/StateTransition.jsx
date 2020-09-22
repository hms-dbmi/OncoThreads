import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer, Provider } from 'mobx-react';
import { extendObservable, reaction } from 'mobx';
import HeatmapGroupTransition from './Transitions/HeatmapGroupTransition/HeatmapGroupTransition';
import LineTransition from './Transitions/LineTransition/LineTransition';
import SankeyTransition from './Transitions/SankeyTransition/SankeyTransition';
import { getColorByName } from '../UtilityClasses';

import * as d3 from "d3"


/**
 * Component for the Block view
 */
const BlockView = inject('rootStore', 'uiStore', 'undoRedoStore')(observer(class BlockView extends React.Component {
    timeStepHeight = 50;
    rectHeight = 20;
    padding = 20;
    partitionGap = 15;
    overviewWidthRatio = 0.35;
    constructor(props) {
        super(props);
        this.blockView = React.createRef();

        // this.handleTimeClick = this.handleTimeClick.bind(this);
        // this.setHighlightedVariable = this.setHighlightedVariable.bind(this);
        // this.removeHighlightedVariable = this.removeHighlightedVariable.bind(this);
        this.updateDimensions = this.updateDimensions.bind(this);
        extendObservable(this, {
            highlightedVariable: '', // variableId of currently highlighted variable
            order: ['labels', 'operators', 'view', 'legend'],
            width: window.innerWidth,
            hasBackground: true,
            panes: {
                labels: { width: (window.innerWidth - 40) / 10 * 0.5, active: false },
                operators: { width: ((window.innerWidth - 40) / 10) * 1.5, active: false },
                view: { width: ((window.innerWidth - 40) / 10) * 6.5, active: false },
                legend: { width: (window.innerWidth - 40) / 10 * 1.5, active: false },
            },
            ref: React.createRef(),
            
        });
    }

    /**
     * Add event listener
     */
    componentDidMount() {

        this.updateDimensions()
        window.addEventListener('resize', this.updateDimensions);
    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    updateDimensions(){
        this.width = this.ref.current.getBoundingClientRect().width *0.35
    }

    /**
     * gets timepoints and transitions
     * @return {*[]}
     */
    getTimepointAndTransitions() {
        const timepoints = [];
        const transitions = [];
        let {dataStore} = this.props.rootStore
        let rectWidthScale = d3.scaleLinear()
        .domain([0, dataStore.numberOfPatients])
        .range([0, this.width - (dataStore.maxPartitions - 1) * this.partitionGap ]);

        this.props.rootStore.dataStore.timepoints
            .forEach((d, i) => {
                let rectWidth = this.props.rootStore.visStore.sampleRectWidth;
                // check the type of the timepoint to get the correct width of the heatmap rectangles


                // create timepoints
                if (d.heatmap) {
                    if (d.isGrouped) {
                        const transformTP = `translate(
                        ${0},
                        ${i*this.timeStepHeight}
                        )`;
                        let offsetX = 0, gap= this.partitionGap;
                        let timePoint = []

                        d.customGrouped.forEach(d=>{
                            let stageKey = d.partition||''
                            let patients = d.patients
                            let rectWidth = rectWidthScale(patients.length)
                            timePoint.push( <rect fill={getColorByName(stageKey)} width={rectWidth} height={this.rectHeight} x={offsetX} key={`time${i}state${stageKey}`}/>)
                            offsetX += rectWidth + gap
                        })
                        timepoints.push(
                            <g key={d.globalIndex} transform={transformTP}>
                                {timePoint}
                            </g>,
                        );
                    } 
                }
                // create transitions
                // if(d.type=='between') return
                if (i !== this.props.rootStore.dataStore.timepoints.length - 1) {
                    const transformTR = `translate(0,${this.props.rootStore.visStore.newTimepointPositions.connection[i]})`;
                    const firstTP = d;
                    let secondTP = this.props.rootStore.dataStore.timepoints[i + 1];
                    // if (secondTP.type=='between' & i<this.props.rootStore.dataStore.timepoints.length - 2){
                    //     secondTP = this.props.rootStore.dataStore.timepoints[i + 2];
                    // }
                    let firstGrouped=firstTP.customGrouped,
                    secondGrouped=secondTP.customGrouped
                    
                    let transition;
                    if (firstTP.customPartitions.length > 0) {
                        if (secondTP.customPartitions.length > 0) {
                            transition = (
                                <Provider
                                    dataStore={this.props.rootStore.dataStore}
                                    visStore={this.props.rootStore.visStore}
                                >
                                    <SankeyTransition
                                        index={i}
                                        firstGrouped={firstTP.customGrouped}
                                        secondGrouped={secondTP.customGrouped}
                                        firstPrimary={this.props.rootStore.dataStore
                                            .variableStores[firstTP.type]
                                            .getById(firstTP.primaryVariableId)}
                                        secondPrimary={this.props.rootStore.dataStore
                                            .variableStores[secondTP.type]
                                            .getById(secondTP.primaryVariableId)}
                                        tooltipFunctions={this.props.tooltipFunctions}
                                    />
                                </Provider>
                            );
                        } 
                    } 
                    transitions.push(
                        <g
                            key={firstTP.globalIndex}
                            transform={transformTR}
                        >
                            {transition}
                        </g>,
                    );
                }
            });
        return [transitions, timepoints];
    }


    render() {
        return (
            <div className="blockView" ref={this.ref}>

                <div ref={this.blockView} className="scrollableX" style={{height:window.innerHeight-200, overflowY:"auto"}}>
                    <svg
                        width="100%"
                        // height="100%"
                        // width={this.props.rootStore.visStore.svgWidth}
                        height={this.props.rootStore.visStore.svgHeight}
                    >
                        {this.getTimepointAndTransitions()}
                    </svg>
                </div>

                <form id="svgform" method="post">
                    <input type="hidden" id="output_format" name="output_format" value="" />
                    <input type="hidden" id="data" name="data" value="" />
                </form>

            </div>
        );
    }
}));
BlockView.propTypes = {
    tooltipFunctions: PropTypes.objectOf(PropTypes.func).isRequired,
    showContextMenuHeatmapRow: PropTypes.func.isRequired,
};
export default BlockView;
