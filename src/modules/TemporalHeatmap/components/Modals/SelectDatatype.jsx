import React from 'react';
import { observer } from 'mobx-react';
import { Button, ControlLabel, FormControl, FormGroup, Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';

/**
 * Modal for selecting the datatype of a molecular file during loading of local files
 */
const SelectDatatype = observer(class SelectDatatype extends React.Component {
    constructor(props) {
        super(props);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleOkay = this.handleOkay.bind(this);
    }

    /**
     * gets the select inputs for each file
     * @return {FormGroup[]}
     */
    getSelect() {
        return this.props.fileNames.map((fileName, i) => (
            <FormGroup key={fileName} controlId="formControlsSelect">
                <ControlLabel>{`${fileName} datatype`}</ControlLabel>
                <FormControl
                    onChange={e => this.handleChange(fileName, e.target.value, i)}
                    componentClass="select"
                    placeholder="select"
                >
                    <option value="CNVDisc">Discrete CNV data</option>
                    <option value="CNVCont">Continuous CNV data</option>
                    <option value="UnspecCont">Other Continuous</option>
                </FormControl>
            </FormGroup>
        ));
    }

    /**
     * handles selecting a different datatype
     * @param {string} fileName
     * @param {string} value - selected option
     * @param {number} index - index of the file in fileName array
     */
    handleChange(fileName, value, index) {
        switch (value) {
        case 'UnspecCont':
            this.props.setDatatype(index, 'CONTINUOUS', fileName);
            break;
        case 'CNVCont':
            this.props.setDatatype(index, 'CONTINUOUS', 'COPY_NUMBER_ALTERATION');
            break;
        default:
            this.props.setDatatype(index, 'DISCRETE', 'COPY_NUMBER_ALTERATION');
            break;
        }
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
                onHide={this.props.closeModal}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Select data types for provided files</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        {this.getSelect()}
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleCancel}>Cancel</Button>
                    <Button onClick={this.handleOkay}>Okay</Button>
                </Modal.Footer>
            </Modal>
        );
    }
});
SelectDatatype.propTypes = {
    closeModal: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
    callback: PropTypes.func.isRequired,
    setDatatype: PropTypes.func.isRequired,
    fileNames: PropTypes.arrayOf(PropTypes.string),
};
export default SelectDatatype;
