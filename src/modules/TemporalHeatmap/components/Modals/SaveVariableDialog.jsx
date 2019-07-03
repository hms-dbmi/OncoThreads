import React from 'react';
import { observer } from 'mobx-react';
import { Button, Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import DerivedVariable from '../../stores/DerivedVariable';

/**
 * Dialog for asking the user if she wants to save the
 * modified variable after deleting it from the view
 */
const SaveVariableDialog = observer(class SaveVariableDialog extends React.Component {
    constructor() {
        super();
        this.handleCancel = this.handleCancel.bind(this);
        this.handleOkay = this.handleOkay.bind(this);
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
                    <Modal.Title>Save variable</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {`Save custom variable ${this.props.variable.name} for later use?`}

                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleCancel}>Cancel</Button>
                    <Button onClick={this.handleOkay}>Okay</Button>
                </Modal.Footer>
            </Modal>
        );
    }
});
SaveVariableDialog.propTypes = {
    closeModal: PropTypes.func.isRequired,
    callback: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
    variable: PropTypes.instanceOf(DerivedVariable).isRequired,
};
export default SaveVariableDialog;
