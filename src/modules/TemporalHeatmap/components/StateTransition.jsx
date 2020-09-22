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
    timeStepHeight = 65;
    rectHeight = 20;
    padding = 20;
    partitionGap = 15;
    overviewWidthRatio = 0.35;
    linkMaxWidth = 20;
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

        let layoutDict = []

        // draw timepoints
        this.props.rootStore.dataStore.timepoints
            .forEach((d, i) => {

                    const transformTP = `translate(
                    ${0},
                    ${i*this.timeStepHeight}
                    )`;
                    let offsetX = 0, gap= this.partitionGap;
                    let timepoint = []
                    layoutDict.push({})

                    d.customGrouped.forEach(d=>{
                        let stageKey = d.partition||''
                        let patients = d.patients
                        let rectWidth = rectWidthScale(patients.length)
                        timepoint.push( <rect fill={getColorByName(stageKey)} width={rectWidth} height={this.rectHeight} x={offsetX} key={`time${i}state${stageKey}`}/>)
                        
                        layoutDict[i][stageKey] = {
                            width: rectWidth,
                            x: offsetX
                        }

                        offsetX += rectWidth + gap
                    })
                    timepoints.push(
                        <g key={d.globalIndex} transform={transformTP}>
                            {timepoint}
                        </g>,
                    )
            });


        // draw transitions
        let linkGene = d3.linkVertical().x(d=>d[0]).y(d=>d[1])
        let linkWidthScale = d3.scaleLinear().domain([0, dataStore.numberOfPatients]).range([1, this.linkMaxWidth])
        this.props.rootStore.dataStore.timepoints
            .forEach((d,i)=>{
                if(i !== this.props.rootStore.dataStore.timepoints.length - 1){
                    const transformTR = `translate(0,${this.props.rootStore.visStore.newTimepointPositions.connection[i]})`;
                    let firstTP = d,
                    secondTP = this.props.rootStore.dataStore.timepoints[i + 1];
                    let firstGrouped=firstTP.customGrouped,
                    secondGrouped=secondTP.customGrouped
                    firstGrouped.forEach((group1, firstIdx)=>{
                        secondGrouped.forEach((group2, secondIdx)=>{
                            let {patients: patients1, partition: partition1} = group1, {patients: patients2, partition: partition2} = group2
                            let transPatients = patients1.filter(d=>patients2.includes(d))
                            if (transPatients.length>0){
                                let layoutDict1 = layoutDict[i][partition1], layoutDict2 = layoutDict[i+1][partition2]
                                let sourceX = layoutDict1.x + layoutDict1.width/2, 
                                    sourceY = i*this.timeStepHeight + this.rectHeight, 
                                    targetX = layoutDict2.x + layoutDict2.width/2, 
                                    targetY =  (i+1)*this.timeStepHeight
                                transitions.push( <path key={`time_${i}to${i+1}_trans_${partition1}_${partition2}`} 
                                d={linkGene({
                                    source: [sourceX, sourceY], target:[targetX, targetY]
                                })}
                                fill="none"
                                stroke="lightgray"
                                strokeWidth={linkWidthScale(transPatients.length)}
                                />)
                            }
                        })
                    })
                }
            })
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
