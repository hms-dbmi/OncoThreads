import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer, Provider } from 'mobx-react';
import { extendObservable, } from 'mobx';

import { InputNumber, Card, Tooltip, Row, Col, Switch } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import './index.css'

import CustomGrouping from './CustomGrouping'
import TransitionOverview from './TransitionOverview'
import TransitionComparison from './TransitionComparison'

/**
 * Component for the Block view
 */
const StateTransition = inject('rootStore', 'uiStore', 'undoRedoStore')(observer(class StateTransition extends React.Component {
    constructor(props) {
        super(props);

        this.updateDimensions = this.updateDimensions.bind(this);
        extendObservable(this, {
            highlightedVariable: '', // variableId of currently highlighted variable
            order: ['labels', 'operators', 'view', 'legend'],
            height: window.innerHeight - 260,
            width: window.innerWidth - 10,
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
        this.height = window.innerHeight - 260
        this.width = window.innerWidth - 10
        
    }
    
    get overviewWidth(){
        return this.width/4*0.98
    }

    get comparisonWidth(){
        return this.width/2*0.95
    }



    render() {
        let { dataStore } = this.props.rootStore

        let controller = <span>
            Num of Sequence Groups
            <InputNumber min={0} step={1} value={dataStore.patientGroupNum} size="small" onChange={dataStore.changePatientGroupNum}/>
        </span>

        let bgController = <span>
            <Switch size="small"
            checkedChildren="detailed" unCheckedChildren= "only state"
            onChange={() => {
                this.hasBackground = !this.hasBackground
            }} />
        </span>

        

        return (
            <div className="blockView" ref={this.ref}>
                <Row>
                    <Col className="customGrouping" md={6} sm={6}>
                            <CustomGrouping/>
                    </Col>

                    <Col md={6} sm={6}>
                        <Card title={<span style={{ fontSize: "17px" }}>Overview <Tooltip title="transition among the identified states"><InfoCircleOutlined translate='' /></Tooltip></span>}
                            extra={controller} 
                            style={{width:"98%"}}
                            // style={{ width: (this.overviewWidthRatio * 100).toFixed(2) + '%', marginTop: "5px", float: "left" }}
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
                                    <TransitionOverview width = {this.overviewWidth}/>
                                </svg>
                            </div>

                            <form id="svgform" method="post">
                                <input type="hidden" id="output_format" name="output_format" value="" />
                                <input type="hidden" id="data" name="data" value="" />
                            </form>
                        </Card>
                    </Col>

                    <Col md={12} sm={12}>
                        <Card title={<span style={{ fontSize: "17px" }}>Details <Tooltip title="detailed analysis of the cause of different state transitions"><InfoCircleOutlined translate='' /></Tooltip></span>}
                            extra={bgController} 
                            style={{width:"98%"}}
                            // style={{ width: (this.detailedWidthRatio * 100).toFixed(2) + '%', marginTop: "5px", marginLeft: "1%", float: "left" }}
                            data-intro="state transition details"
                        >
                            <div className="stateTransition details" style={{ height: this.height, overflowY: "auto" }}>
                                <svg
                                    width="100%"
                                    className="stateTransition details"
                                    // height="100%"
                                    // width={this.props.rootStore.visStore.svgWidth}
                                    height={this.props.rootStore.visStore.svgHeight}
                                >
                                    <TransitionComparison width = {this.comparisonWidth} tooltipFunctions={this.props.tooltipFunctions} hasBackground={this.hasBackground}/>
                                </svg>
                            </div>

                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}));
 
export default StateTransition;
