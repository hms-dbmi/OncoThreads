import React from 'react';
import {observer} from 'mobx-react';
import BinSelector from './BinSelector'
import BinNames from './BinNames'
import {Alert, Button, Modal} from 'react-bootstrap';


const BinningModal = observer(class ContinuousBinner extends React.Component {
    render() {
        let alert=null;
        if(this.props.showAlert) {
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
                                 handleNumberOfBinsChange={this.props.handleNumberOfBinsChange}/>
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