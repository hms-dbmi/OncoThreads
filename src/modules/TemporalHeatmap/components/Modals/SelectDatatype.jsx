import React from 'react';
import {observer} from 'mobx-react';
import {Button, ControlLabel, FormControl, FormGroup, Modal, Radio} from 'react-bootstrap';


const SelectDatatype = observer(class SelectDatatype extends React.Component {
    constructor(props) {
        super(props);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleOkay = this.handleOkay.bind(this);
    }

    getRadios() {
        return this.props.fileNames.map((fileName, i) => {
            return <FormGroup key={fileName}>
                {fileName}:
                {' '}<Radio checked={this.props.datatypes[i] === "DISCRETE"} value="STRING"
                            onChange={() => this.props.setDatatype(i, "DISCRETE")} inline>
                Discrete
            </Radio>{' '}
                <Radio checked={this.props.datatypes[i] === "NUMBER"} value="NUMBER"
                       onChange={() => this.props.setDatatype(i, "NUMBER")} inline>
                    Continuous (log2)
                </Radio>
            </FormGroup>
        });
    }

    handleChange(fileName, value, index) {
        switch (value) {
            case "UnspecCont":
                this.props.setDatatype(index, "CONTINUOUS", fileName);
                break;
            case "UnspecDisc":
                this.props.setDatatype(index, "DISCRETE", fileName);
                break;
            case "CNVDisc":
                this.props.setDatatype(index, "DISCRETE", "COPY_NUMBER_ALTERATION");
                break;

        }
    }

    getSelect() {
        return this.props.fileNames.map((fileName, i) => {
            return <FormGroup key={fileName} controlId="formControlsSelect">
                <ControlLabel>{fileName + " datatype"}</ControlLabel>
                <FormControl onChange={(e) => this.handleChange(fileName, e.target.value, i)} componentClass="select"
                             placeholder="select">
                    <option value="UnspecCont">Continuous</option>
                    <option value="CNVDisc">Discrete CNV data</option>
                    <option value="UnspecDisc">Other discrete</option>
                </FormControl>
            </FormGroup>
        })
    }

    handleOkay() {
        this.props.callback(true);
        this.props.closeModal();
    }

    handleCancel() {
        this.props.callback(false);
        this.props.closeModal();
    }

    render() {
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{"Select data types for provided files"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        {this.getSelect()}
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleOkay}>Okay</Button>
                    <Button onClick={this.handleCancel}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default SelectDatatype;