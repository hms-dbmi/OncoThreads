import React from 'react';
import {observer} from 'mobx-react';
import {Button, ButtonGroup, Col, ControlLabel, Form, FormControl, FormGroup} from 'react-bootstrap';


const BinNames = observer(class BinNames extends React.Component {
    render() {
        let binNameFields = [];
        if (!this.props.isBinary) {
            for (let i = 0; i < this.props.binNames.length; i++) {
                binNameFields.push([<FormGroup key={"Bin" + (i + 1)}>
                    <Col componentClass={ControlLabel} sm={2}>
                        Bin {i + 1}:
                    </Col>
                    <Col sm={10}>
                        <FormControl
                            onChange={(e) => this.props.handleBinNameChange(e, i)} type="text"
                            value={this.props.binNames[i].name}/></Col></FormGroup>]);
            }
        }
        else {
            for (let i = 0; i < this.props.binNames.length; i++) {
                binNameFields.push(<FormGroup key={"Bin" + (i + 1)}>
                    <Col componentClass={ControlLabel} sm={2}>
                        Bin {i + 1}:
                    </Col>
                    <Col sm={10}>
                        <ButtonGroup>
                            <Button onClick={(e) => this.props.handleBinNameChange(e, i)}
                                    active={this.props.binNames[i].name === true} value={true}>true</Button>
                            <Button onClick={(e) => this.props.handleBinNameChange(e, i)}
                                    active={this.props.binNames[i].name !== true} value={false}>false</Button>
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
});
export default BinNames;