import React from 'react';
import {observer} from 'mobx-react';
import {Col, ControlLabel, Form, FormControl, FormGroup} from 'react-bootstrap';


const BinNames = observer(class BinNames extends React.Component {
    render() {
        let binNameFields = [];
        for (let i = 0; i < this.props.binNames.length; i++) {
            binNameFields.push([<Col key={"Bin" + (i + 1)} componentClass={ControlLabel} sm={2}>
                Bin {i + 1}:
            </Col>,
                <Col sm={10}>
                    <FormControl
                        onChange={(e) => this.props.handleBinNameChange(e, i)} type="text"
                        defaultValue={this.props.binNames[i]}/></Col>]);
        }
        return (
            <Form horizontal>
                <FormGroup>
                    {binNameFields}
                </FormGroup>
            </Form>
        )
    }
});
export default BinNames;