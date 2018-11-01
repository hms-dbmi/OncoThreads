import React from 'react';
import {observer} from 'mobx-react';
import BinSelector from './BinSelector'
import BinNames from './BinNames'
import * as d3 from 'd3';
import {Alert, Button, FormGroup, Modal, Radio} from 'react-bootstrap';


const BinningModal = observer(class ContinuousBinner extends React.Component {
    constructor() {
        super();
        this.state = {transformXFunction: d3.scaleLinear(), yScale: d3.scaleLinear(), isXLog: false};
        this.setXScaleType = this.setXScaleType.bind(this);
        this.setYScaleType = this.setYScaleType.bind(this);
    }

    setXScaleType(event) {
        let scale, isLog;
        if (event.target.value === 'linear') {
            isLog = false;
            scale = function (d) {
                return d;
            };
        }
        else {
            isLog = true;
            scale = function (d) {
                return Math.log10(d + 1);
            };
        }
        this.setState({transformXFunction: scale, isXLog: isLog});
    }

    setYScaleType(event) {
        let scale;
        if (event.target.value === 'linear') {
            scale = d3.scaleLinear();
        }
        else {
            scale = d3.scaleLog().base(10);
        }
        this.setState({yScale: scale});
    }

    getRadio() {
        let disabled=false;
        if (d3.min(this.props.data) < 0) {
            disabled=true;
        }
            return (<FormGroup>
                <Radio defaultChecked onClick={this.setXScaleType} disabled={disabled} value={'linear'} name="XradioGroup" inline>
                    Linear
                </Radio>{' '}
                <Radio onClick={this.setXScaleType} value={'log'} disabled={disabled} name="XradioGroup" inline>
                    Log
                </Radio>{' '}
            </FormGroup>);


    }

    render() {
        let alert = null;
        if (this.props.showAlert) {
            alert = <Alert bsStyle="info">
                <strong>Please bin the continuous variable before grouping</strong>
            </Alert>;
        }
        return (
            
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Bin {this.props.variable.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {alert}
                    <BinSelector data={this.props.data} width={450} height={300}
                                 variableName={this.props.variable.name}
                                 handleBinChange={this.props.handleBinChange}
                                 transformXFunction={this.state.transformXFunction}
                                 isXLog={this.state.isXLog}
                                 yScale={this.state.yScale}
                                 handleNumberOfBinsChange={this.props.handleNumberOfBinsChange}/>
                    {/* <h5>X-axis</h5>*/}
                    {this.getRadio()}
                    {/*<h5>Y-axis</h5>
                    <FormGroup>
                        <Radio defaultChecked onClick={this.setYScaleType} value={'linear'} name="YradioGroup" inline>
                            Linear
                        </Radio>{' '}
                        <Radio onClick={this.setYScaleType} value={'log'} name="YradioGroup" inline>
                            Log
                        </Radio>{' '}
                    </FormGroup>*/}
                    <BinNames binNames={this.props.binNames} handleBinNameChange={this.props.handleBinNameChange}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.handleApply}>Apply</Button>
                    <Button onClick={this.props.close}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default BinningModal;