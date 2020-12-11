import React from 'react';
import { observer, inject } from 'mobx-react';
import { observable, action, computed } from 'mobx';
import * as d3 from 'd3';
import { InputNumber, Slider, Card, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';



import { IPoint, TPointGroups, IRootStore  } from 'modules/Type'


import "./CustomGrouping.css"
import StateInfo from './StateInfo'
import { Switch } from 'antd';
import StateBlock from './StateBlock';
import Scatter from './Scatter'

/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */

type TimeState = {
    timeIdx: number,
    partitions: Partition[]
}
type EventState = TimeState
type Partition = {
    partition: string, //state name
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

export type TState = {
    domains: {
        [attrName: string]: string[] | number[] | boolean[]
    },
    points: number[],
    stateKey: string
}

export interface IImportantScore {
    name:string,
    score:number
}




interface Props {
    rootStore?: IRootStore,
}

@inject('rootStore')
@observer
class CustomGrouping extends React.Component<Props> {
    @observable width: number = window.innerWidth / 2
    @observable height: number = window.innerHeight - 260
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
     * computed based on pointGroups, points, currentVariables
     * return the attribute domain of each states
     */
    @computed
    get states(): TState[] {
        let {pointGroups, currentVariables, points}  = this.props.rootStore!.dataStore

        let groupedPoints: IPoint[][] = Object.values(pointGroups)
            .map(group => {
                return points
                    .filter((_, i) => group.pointIdx.includes(i))
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

        let states = groupedPoints.map((p, stateIdx) => {
            let state: TState = {
                stateKey: Object.keys(pointGroups)[stateIdx],
                domains: {},
                points: p.map(p => p.idx)
            }
            currentVariables.forEach((name, valueIdx) => {
                state.domains[name] = summarizeDomain(
                    p.map(p => p.value[valueIdx]).filter(v=>v!==undefined) as number[] | string[] | boolean[]
                )
            })

            return state
        })

        return states
    }


    /**
     * summarize the pointGroups group of points
     * @param {patient:string, value:number[], timeIdx: number}[] points 
     * @param string[] pointGroups: ids of points
     * @param string[] currentVariables
     * @return {variableName: domain} group
     */

    @action
    resetGroup() {
        let {dataStore} = this.props.rootStore!
        dataStore.updatePointGroups({})
        dataStore.resetStateLabel()


        d3.selectAll('circle.point')
            .attr('fill', 'gray')
            .attr('r', 5)
            .attr('class', 'point')
    }

    @action
    deleteGroup(stateKey: string) {
        let {dataStore} = this.props.rootStore!
        dataStore.deletePointGroup(stateKey)

        d3.selectAll(`circle.group_${stateKey}`)
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
    updateSelected(stateKeys: string[], groups: number[][]) {
        let {dataStore} = this.props.rootStore!

        let {pointGroups} = dataStore

        for (let i = 0; i < groups.length; i++) {
            let stateKey = stateKeys[i], group = groups[i]

            if (group.length === 0) {
                delete pointGroups[stateKey]
            } else {
                pointGroups[stateKey] = {
                    stateKey,
                    pointIdx: group
                }
            }
        }
        dataStore.updatePointGroups(pointGroups)

    }

    @action
    resetSelected(stateKeys: string[], groups: number[][]) {

        let newSelected:TPointGroups = {}
        for (let i = 0; i < stateKeys.length; i++) {
            let stateKey = stateKeys[i], group = groups[i]
            newSelected[stateKey] = {
                stateKey,
                pointIdx: group
            }
        }

        let {dataStore} = this.props.rootStore!

        dataStore.updatePointGroups(newSelected)

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
        this.height = window.innerHeight - 300
    }

    @action
    onChangeThreshold(thr: number|string|undefined) {
        this.props.rootStore!.dataStore.changeClusterNum(thr)
    }

    @action
    removeVariable(variableName:string){

        this.props.rootStore!.dataStore.removeVariable(variableName);
    }

    render() {
        let {dataStore} = this.props.rootStore!
        let { points, toggleHasEvent} = dataStore
        let { width, height, hasLink } = this
        let pcpMargin = 15
        let scatterHeight = height * 0.35, pcpHeight = height * 0.45, infoHeight = height * 0.2
        

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
                Num of States
            </span>

            <InputNumber size="small" 
                min={0}
                max={8}
                step={1} 
                value={dataStore.numofStates}
                onChange={this.onChangeThreshold} 
                style={{ width: "70px"}}
                />
           
        </span>

        </div>

        return (
            // <div className="container" style={{ width: "100%" }} data-intro="<b>modify</b> state identification here">
            <Card 
                title={<span style={{fontSize:"17px"}}>State Identification <Tooltip title="identify state based on pointGroups timepoint features"><InfoCircleOutlined translate=''/></Tooltip></span>} 
                extra={controllerView} 
                style={{width:"98%"}}
                data-intro="<b>modify</b> state identification here"
            >
      
                <div
                    className="customGrouping"
                    style={{ height: `${height}px`, width: "98%", margin:"1%"}}
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
                        />
                        <g className='stateBlock' transform={`translate(${0}, ${pcpMargin + scatterHeight})`} data-intro="each point is ..">
                            <StateBlock
                                stateLabels={dataStore.stateLabels}
                                importanceScores={dataStore.importanceScores}
                                width={width}
                                height={pcpHeight - 2 * pcpMargin}
                                points={points}
                                pointGroups={dataStore.pointGroups}
                                colorScales={dataStore.colorScales}
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
                                pointGroups={this.pointGroups}
                            />
                        </g> */}
                    </svg>
                    <StateInfo
                        states={this.states} height={infoHeight}
                        stateLabels={dataStore.stateLabels}
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
