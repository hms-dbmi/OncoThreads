import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer, Provider } from 'mobx-react';
import { extendObservable, reaction } from 'mobx';
import { getColorByName } from '../../UtilityClasses';

import * as d3 from "d3"
import { InputNumber, Card, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import './index.css'


/**
 * Component for the Block view
 */
const BlockView = inject('rootStore', 'uiStore', 'undoRedoStore')(observer(class BlockView extends React.Component {
    timeStepHeight = 65;
    rectHeight = 20;
    padding = 20;
    partitionGap = 15;
    overviewWidthRatio = 0.35;
    detailedWidthRatio = 0.64;
    linkMaxWidth = 20;
    constructor(props) {
        super(props);

        // this.handleTimeClick = this.handleTimeClick.bind(this);
        // this.setHighlightedVariable = this.setHighlightedVariable.bind(this);
        // this.removeHighlightedVariable = this.removeHighlightedVariable.bind(this);
        this.updateDimensions = this.updateDimensions.bind(this);
        extendObservable(this, {
            highlightedVariable: '', // variableId of currently highlighted variable
            order: ['labels', 'operators', 'view', 'legend'],
            width: window.innerWidth,
            height: window.innerHeight - 330,
            hasBackground: true,
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

    updateDimensions() {
        this.width = this.ref.current.getBoundingClientRect().width
        this.height = window.innerHeight - 330
    }

    /**
     * gets timepoints and transitions
     * @return {*[]}
     */
    getTimepointAndTransitions() {
        const paddingW = 5, paddingH = 10
        const timepoints = [];
        const transitions = [];
        let { dataStore } = this.props.rootStore
        let rectWidthScale = d3.scaleLinear()
            .domain([0, dataStore.numberOfPatients])
            .range([paddingW, this.width * this.overviewWidthRatio - (dataStore.maxPartitions - 1) * this.partitionGap - 2*paddingW]);

        let layoutDict = []

        // draw timepoints
        this.props.rootStore.dataStore.timepoints
            .forEach((d, i) => {

                const transformTP = `translate(
                    ${paddingW},
                    ${paddingH + i * this.timeStepHeight}
                    )`;
                let offsetX = paddingW, gap = this.partitionGap;
                let timepoint = []
                layoutDict.push({})

                d.customGrouped.forEach(d => {
                    let stageKey = d.partition || ''
                    let patients = d.patients
                    let rectWidth = rectWidthScale(patients.length)
                    timepoint.push(<rect fill={getColorByName(stageKey)} width={rectWidth} height={this.rectHeight} x={offsetX} key={`time${i}state${stageKey}`} />)

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
        let linkGene = d3.linkVertical().x(d => d[0]).y(d => d[1])
        let linkWidthScale = d3.scaleLinear().domain([0, dataStore.numberOfPatients]).range([1, this.linkMaxWidth])
        this.props.rootStore.dataStore.timepoints
            .forEach((d, i) => {
                if (i !== this.props.rootStore.dataStore.timepoints.length - 1) {
                    const transformTR = `translate(0,${this.props.rootStore.visStore.newTimepointPositions.connection[i]})`;
                    let firstTP = d,
                        secondTP = this.props.rootStore.dataStore.timepoints[i + 1];
                    let firstGrouped = firstTP.customGrouped,
                        secondGrouped = secondTP.customGrouped
                    firstGrouped.forEach((group1, firstIdx) => {
                        secondGrouped.forEach((group2, secondIdx) => {
                            let { patients: patients1, partition: partition1 } = group1, { patients: patients2, partition: partition2 } = group2
                            let transPatients = patients1.filter(d => patients2.includes(d))
                            if (transPatients.length > 0) {
                                let layoutDict1 = layoutDict[i][partition1], layoutDict2 = layoutDict[i + 1][partition2]
                                let sourceX = layoutDict1.x + layoutDict1.width / 2,
                                    sourceY = paddingH + i * this.timeStepHeight + this.rectHeight,
                                    targetX = layoutDict2.x + layoutDict2.width / 2,
                                    targetY = paddingH + (i + 1) * this.timeStepHeight
                                transitions.push(<path key={`time_${i}to${i + 1}_trans_${partition1}_${partition2}`}
                                    d={linkGene({
                                        source: [sourceX, sourceY], target: [targetX, targetY]
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
        let controller = <span>
            Sequence Grouping THR
        <InputNumber min={0} max={2} step={0.1} value={0.2} size="small" />
        </span>

        return (
            <div className="blockView" ref={this.ref}>
                <Card title={<span style={{ fontSize: "17px" }}>State Transition<Tooltip title="transition among the identified states"><InfoCircleOutlined translate='' /></Tooltip></span>}
                    extra={controller} style={{ width: (this.overviewWidthRatio * 100).toFixed(2) + '%', marginTop: "5px", float: "left" }}
                    data-intro="state transition overview"
                >

                    <div className="stateTransition overview" style={{ height: this.height, overflowY: "auto" }}>

                        <svg
                            width="100%"
                            className="stateTransition overview"
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

                </Card>
                <Card title={<span style={{ fontSize: "17px" }}>State Transition Details <Tooltip title="transition among the identified states"><InfoCircleOutlined translate='' /></Tooltip></span>}
                    extra='' style={{ width: (this.detailedWidthRatio * 100).toFixed(2) + '%', marginTop: "5px", marginLeft: "1%", float: "left" }}
                    data-intro="state transition details"
                >
                    <div className="stateTransition details" style={{ height: this.height, overflowY: "auto" }}>
                    <svg
                        width="100%"
                        className="stateTransition details"
                        // height="100%"
                        // width={this.props.rootStore.visStore.svgWidth}
                        height={this.props.rootStore.visStore.svgHeight}
                    ></svg>
                    </div>

                </Card>
            </div>
        );
    }
}));
BlockView.propTypes = {
    tooltipFunctions: PropTypes.objectOf(PropTypes.func).isRequired,
    showContextMenuHeatmapRow: PropTypes.func.isRequired,
};
export default BlockView;
