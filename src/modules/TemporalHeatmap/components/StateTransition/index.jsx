import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer, Provider } from 'mobx-react';
import { extendObservable, } from 'mobx';

import { InputNumber, Card, Tooltip, Row, Col } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import './index.css'

import CustomGrouping from './CustomGrouping'
import TransitionOverview from './TransitionOverview'
/**
 * Component for the Block view
 */
const StateTransition = inject('rootStore', 'uiStore', 'undoRedoStore')(observer(class StateTransition extends React.Component {
    constructor(props) {
        super(props);

        // this.handleTimeClick = this.handleTimeClick.bind(this);
        // this.setHighlightedVariable = this.setHighlightedVariable.bind(this);
        // this.removeHighlightedVariable = this.removeHighlightedVariable.bind(this);
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



    render() {
        let controller = <span>
            Sequence Grouping THR
        <InputNumber min={0} max={2} step={0.1} value={0.2} size="small" />
        </span>

        let { dataStore } = this.props.rootStore

        return (
            <div className="blockView" ref={this.ref}>
                <Row>
                    <Col className="customGrouping" md={6} sm={6}>
                        <Provider dataStore={dataStore}>
                            <CustomGrouping
                                points={
                                    dataStore.points
                                }
                                currentVariables={dataStore.currentVariables}
                                referencedVariables={dataStore.referencedVariables}
                                stateLabels={dataStore.stateLabels}
                                colorScales={dataStore.colorScales}
                            />
                            {/* <CustomGrouping/> */}
                        </Provider>
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
                                    <TransitionOverview overviewWidth = {this.overviewWidth}/>
                                </svg>
                            </div>

                            <form id="svgform" method="post">
                                <input type="hidden" id="output_format" name="output_format" value="" />
                                <input type="hidden" id="data" name="data" value="" />
                            </form>
                        </Card>
                    </Col>

                    <Col md={12} sm={12}>
                        <Card title={<span style={{ fontSize: "17px" }}>Details <Tooltip title="transition among the identified states"><InfoCircleOutlined translate='' /></Tooltip></span>}
                            extra='' 
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
                                ></svg>
                            </div>

                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}));
 
export default StateTransition;
