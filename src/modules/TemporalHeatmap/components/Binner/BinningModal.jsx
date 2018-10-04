import React from 'react';
import {observer} from 'mobx-react';
import BinSelector from './BinSelector'
import BinNames from './BinNames'
import * as d3 from 'd3';
import {Alert, Button, FormGroup, Modal,Radio} from 'react-bootstrap';


const BinningModal = observer(class ContinuousBinner extends React.Component {
    constructor() {
        super();
        this.state = {scaleType: d3.scaleLinear()};
        this.setScaleType = this.setScaleType.bind(this);
    }

    setScaleType(event) {
        let scale;
        if (event.target.value === 'linear') {
            scale = d3.scaleLinear();
        }
        else{
            scale = d3.scaleLog().base(10);
        }
        this.setState({scaleType: scale});
    }

    getRadio() {
        if (d3.min(this.props.data) >= 0) {
            return (<FormGroup>
                <Radio defaultChecked onClick={this.setScaleType} value={'linear'} name="radioGroup" inline>
                    Linear
                </Radio>{' '}
                <Radio onClick={this.setScaleType} value={'log'} name="radioGroup" inline>
                    Log
                </Radio>{' '}
            </FormGroup>);
        }
        else{
            return null;
        }
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
                    <Modal.Title>Bin {this.props.variableName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {alert}
                    <BinSelector data={this.props.data} numBins={this.props.bins} width={450} height={300}
                                 handleBinChange={this.props.handleBinChange}
                                 scaleType={this.state.scaleType}
                                 handleNumberOfBinsChange={this.props.handleNumberOfBinsChange}/>
                    {this.getRadio()}
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