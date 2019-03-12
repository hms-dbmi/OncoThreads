import React from 'react';
import {observer} from 'mobx-react';
import {Button, FormGroup, Modal, Radio} from 'react-bootstrap';


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
                {' '}<Radio checked={this.props.datatypes[i] === "STRING"} value="STRING"
                            onChange={() => this.props.setDatatype(i, "STRING")} inline>
                Discrete
            </Radio>{' '}
                <Radio checked={this.props.datatypes[i] === "NUMBER"} value="NUMBER"
                       onChange={() => this.props.setDatatype(i, "NUMBER")} inline>
                    Continuous (log2)
                </Radio>
            </FormGroup>
        });
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
                    <Modal.Title>{"Select data types for " + this.props.type + " data files."}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        {this.getRadios()}
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