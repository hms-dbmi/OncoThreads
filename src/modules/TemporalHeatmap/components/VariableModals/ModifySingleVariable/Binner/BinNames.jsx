import React from 'react';
import {observer,inject} from 'mobx-react';
import {Button, ButtonGroup, Col, ControlLabel, Form, FormControl, FormGroup} from 'react-bootstrap';

/**
 * BinNames on the bottom of the binner
 */
const BinNames = inject("binningStore")(observer(class BinNames extends React.Component {
    render() {
        let binNameFields = [];
        //case: non-binary binning
        if (!this.props.binningStore.isBinary) {
            for (let i = 0; i < this.props.binningStore.binNames.length; i++) {
                binNameFields.push([<FormGroup key={"Bin" + (i + 1)}>
                    <Col componentClass={ControlLabel} sm={2}>
                        Bin {i + 1}:
                    </Col>
                    <Col sm={10}>
                        <FormControl
                            onChange={(e) => this.props.binningStore.handleBinNameChange(e, i)} type="text"
                            value={this.props.binningStore.binNames[i].name}/></Col></FormGroup>]);
            }
        }
        //case: binary binning
        else {
            for (let i = 0; i < this.props.binningStore.binNames.length; i++) {
                binNameFields.push(<FormGroup key={"Bin" + (i + 1)}>
                    <Col componentClass={ControlLabel} sm={2}>
                        Bin {i + 1}:
                    </Col>
                    <Col sm={10}>
                        <ButtonGroup>
                            <Button onClick={(e) => this.props.binningStore.handleBinNameChange(e, i)}
                                    active={this.props.binningStore.binNames[i].name === true} value={true}>true</Button>
                            <Button onClick={(e) => this.props.binningStore.handleBinNameChange(e, i)}
                                    active={this.props.binningStore.binNames[i].name !== true} value={false}>false</Button>
                        </ButtonGroup>
                    </Col></FormGroup>);
            }
        }
        return (
            <Form horizontal>
                {binNameFields}
            </Form>
        )
    }
}));
export default BinNames;