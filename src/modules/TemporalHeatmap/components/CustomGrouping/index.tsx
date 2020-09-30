import React from 'react';
import { observer, inject, Provider } from 'mobx-react';
import { observable, action, computed } from 'mobx';
import * as d3 from 'd3';
import { message, InputNumber, Slider, Card, Tooltip } from 'antd';
import { PCA } from 'ml-pca';
import { InfoCircleOutlined } from '@ant-design/icons';



import { Point, ReferencedVariables, VariableStore, NormPoint, DataStore } from 'modules/Type'


import "./CustomGrouping.css"

import { getUniqueKeyName } from 'modules/TemporalHeatmap/UtilityClasses/'
import StageInfo from './StageInfo'
import { Switch } from 'antd';
import StageBlock from './StageBlock';
import Scatter from './Scatter'

import { clusterfck } from "../../UtilityClasses/clusterfck.js";

/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */

type TimeStage = {
    timeIdx: number,
    partitions: Partition[]
}
type EventStage = TimeStage
type Partition = {
    partition: string, //stage name
    patients: string[],
    points: number[], // point ids
    rows: Row[]
}
type Row = {
    variable: string, //attribute name
    counts: Count[]
}
type Count = {
    key: string | number | boolean, // attribute value
    patients: string[]
}

export type TStage = {
    domains: {
        [attrName: string]: string[] | number[] | boolean[]
    },
    points: number[],
    stageKey: string
}

export interface IImportantScore {
    name:string,
    score:number
}


export type TSelected = { [stageKey: string]: { stageKey: string, pointIdx: number[] } }


interface Props {
    dataStore: DataStore,
}

@inject('dataStore')
@observer
class CustomGrouping extends React.Component<Props> {
    @observable width: number = window.innerWidth / 2
    @observable height: number = window.innerHeight - 250
    @observable hasLink: boolean = false
    @observable hoverPointID: number = -1
    @observable showGlyph: boolean = false
    private ref = React.createRef<HTMLDivElement>();

    constructor(props: Props) {
        super(props);
        this.ref = React.createRef()

        this.resetGroup = this.resetGroup.bind(this)
        this.deleteGroup = this.deleteGroup.bind(this)
        this.setHoverID = this.setHoverID.bind(this)
        this.resetHoverID = this.resetHoverID.bind(this)
        this.updateSize = this.updateSize.bind(this)
        this.updateSelected = this.updateSelected.bind(this)
        this.onChangeThreshold = this.onChangeThreshold.bind(this)
        this.removeVariable = this.removeVariable.bind(this)

    }

    /**
     * computed based on selected, points, currentVariables
     * return the attribute domain of each stages
     */
    @computed
    get stages(): TStage[] {
        let selected:TSelected  = this.props.dataStore.pointGroups
        let { currentVariables, points}: {currentVariables: string[], points: Point[]} = this.props.dataStore

        let selectedPoints: Point[][] = Object.values(selected)
            .map(s => {
                return points
                    .filter((_, i) => s.pointIdx.includes(i))
            })

        const summarizeDomain = (values: string[] | number[] | boolean[]) => {
            if (typeof (values[0]) == "number") {
                let v = values as number[] // stupid typescropt
                let range = [Math.min(...v).toPrecision(4), Math.max(...v).toPrecision(4)]
                return range
            } else if (typeof (values[0]) == "string") {
                let v = values as string[]
                return [...new Set(v)]
            } else if (typeof (values[0]) == "boolean") {
                let v = values as boolean[]
                return [...new Set(v)]
            } else return []
        }

        let stages = selectedPoints.map((p, stageIdx) => {
            let stage: TStage = {
                stageKey: Object.keys(selected)[stageIdx],
                domains: {},
                points: p.map(p => p.idx)
            }
            currentVariables.forEach((name, valueIdx) => {
                stage.domains[name] = summarizeDomain(
                    p.map(p => p.value[valueIdx]) as number[] | string[] | boolean[]
                )
            })

            return stage
        })



        return stages
    }


    /**
     * summarize the selected group of points
     * @param {patient:string, value:number[], timeIdx: number}[] points 
     * @param string[] selected: ids of points
     * @param string[] currentVariables
     * @return {variableName: domain} group
     */

    @action
    resetGroup() {
        this.props.dataStore.updatePointGroups({})
        this.props.dataStore.resetStageLabel()


        d3.selectAll('circle.point')
            .attr('fill', 'gray')
            .attr('r', 5)
            .attr('class', 'point')
    }

    @action
    deleteGroup(stageKey: string) {
        this.props.dataStore.deletePointGroup(stageKey)

        d3.selectAll(`circle.group_${stageKey}`)
            .attr('fill', 'white')
            .attr('r', 5)
            .attr('class', 'point')

    }

    
    @action
    setHoverID(id: number) {
        this.hoverPointID = id
    }

    @action
    resetHoverID() {
        this.hoverPointID = -1
    }

    @action
    updateSelected(stageKeys: string[], groups: number[][]) {

        let pointGroups = {...this.props.dataStore.pointGroups}

        for (let i = 0; i < groups.length; i++) {
            let stageKey = stageKeys[i], group = groups[i]

            if (group.length === 0) {
                delete pointGroups[stageKey]
            } else {
                pointGroups[stageKey] = {
                    stageKey,
                    pointIdx: group
                }
            }
        }
        this.props.dataStore.updatePointGroups(pointGroups)
        this.props.dataStore.applyCustomGroups()

    }

    @action
    resetSelected(stageKeys: string[], groups: number[][]) {
        let newSelected:TSelected = {}
        for (let i = 0; i < stageKeys.length; i++) {
            let stageKey = stageKeys[i], group = groups[i]
            newSelected[stageKey] = {
                stageKey,
                pointIdx: group
            }
        }
        this.props.dataStore.updatePointGroups(newSelected)
        this.props.dataStore.applyCustomGroups()

    }

    componentDidMount() {
        this.updateSize()
        window.addEventListener('resize', this.updateSize);
    }
    
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateSize);
    }
    updateSize() {
        if (this.ref.current) {
            this.width = this.ref.current.getBoundingClientRect().width
        }
        this.height = window.innerHeight - 250
    }

    @action
    onChangeThreshold(thr: number|string|undefined) {
        this.props.dataStore.changeClusterTHR(thr)
    }

    @action
    removeVariable(variableName:string){

        this.props.dataStore.removeVariable(variableName);
    }

    render() {

        let { points} = this.props.dataStore
        let { width, height, hasLink } = this
        let pcpMargin = 15
        let scatterHeight = height * 0.35, pcpHeight = height * 0.45, infoHeight = height * 0.2
        // used stroe actions
        let toggleHasEvent = this.props.dataStore.toggleHasEvent

        let controllerView =  <div className="controller">

        <Switch size="small"
            checkedChildren="links" unCheckedChildren="links"
            onChange={() => {
                this.hasLink = !this.hasLink
            }} />
        <Switch size="small"
            style={{ marginLeft: '5px' }}
            checkedChildren="events" unCheckedChildren="events"
            onChange={toggleHasEvent} />
        <Switch size="small"
            style={{ marginLeft: '5px' }}
            checkedChildren="glyph" unCheckedChildren="circle"
            onChange={() => {
                this.showGlyph = !this.showGlyph
            }} />
            
        {/* <InputNumber size="small" min={0} max={1} defaultValue={0.2} onChange={this.onChangeThreshold} /> */}
        <span className="thrController">
            <span style={{padding:"0px 0px 0px 5px"}}>
                cluster thr
            </span>

            <InputNumber size="small" 
                min={0}
                max={0.5}
                step={0.02} 
                value={this.props.dataStore.pointClusterTHR}
                onChange={this.onChangeThreshold} 
                style={{ width: "70px"}}
                />
           
        </span>

        </div>

        let {dataStore} = this.props
        return (
            // <div className="container" style={{ width: "100%" }} data-intro="<b>modify</b> state identification here">
            <Card 
                title={<span style={{fontSize:"17px"}}>State Identification <Tooltip title="identify state based on selected timepoint features"><InfoCircleOutlined translate=''/></Tooltip></span>} 
                extra={controllerView} style={{ width: "100%", marginTop: "5px" }}
                data-intro="<b>modify</b> state identification here"
            >
      
                <div
                    className="customGrouping"
                    style={{ height: `${height}px`, width: "100%"}}
                    ref={this.ref}
                >
                   

                    <svg className='customGrouping' width="100%" height={`${scatterHeight + pcpHeight - 35}px`}>
                        <Scatter
                            width={width}
                            height={scatterHeight}
                            hasLink={hasLink}
                            hoverPointID={this.hoverPointID}
                            setHoverID={this.setHoverID}
                            resetHoverID={this.resetHoverID}
                            updateSelected={this.updateSelected}
                            showGlyph={this.showGlyph}
                            dataStore={dataStore}
                        />
                        <g className='stageBlock' transform={`translate(${0}, ${pcpMargin + scatterHeight})`} data-intro="each point is ..">
                            <StageBlock
                                stageLabels={this.props.dataStore.stageLabels}
                                importanceScores={this.props.dataStore.importanceScores}
                                width={width}
                                height={pcpHeight - 2 * pcpMargin}
                                points={points}
                                selected={this.props.dataStore.pointGroups}
                                colorScales={this.props.dataStore.colorScales}
                                hoverPointID={this.hoverPointID}
                                setHoverID={this.setHoverID}
                                resetHoverID={this.resetHoverID}
                                removeVariable = {this.removeVariable}
                            />
                        </g>

                        {/* <g className='PCP' transform={`translate(${pcpMargin}, ${pcpMargin + scatterHeight})`}>
                            <Parset parsetData={this.parsetData}
                                width={width - 2 * pcpMargin}
                                height={pcpHeight - 2 * pcpMargin}
                                points={points}
                            /> 
                            <ParallelSet points={points}
                                currentVariables={this.props.currentVariables}
                                referencedVariables={this.props.referencedVariables}
                                width={width - 2 * pcpMargin}
                                height={pcpHeight - 2 * pcpMargin}
                                selected={this.selected}
                            />
                        </g> */}
                    </svg>
                    <StageInfo
                        stages={this.stages} height={infoHeight}
                        stageLabels={this.props.dataStore.stageLabels}
                        resetGroup={this.resetGroup}
                        deleteGroup={this.deleteGroup}
                    />
                </div>
            </Card>
            /* </div> */
        );
    }
}

export default CustomGrouping
