import React from 'react';
import {observer} from 'mobx-react';
import {Button, Modal} from 'react-bootstrap';

/**
 * Modal showing information about OncoThreads
 */
const AboutModal = observer(class AboutModal extends React.Component {
    render() {
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
            >
                <Modal.Header closeButton>
                    <Modal.Title>About</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{'maxHeight': '400px', 'overflowY': 'auto'}}>
                    OncoThreads is a web-based visualization tool for the interactive exploration of tumor evolution
                    designed to aid researchers in visualizing and exploring temporal patterns within a single patient
                    and across an entire patient cohort.

                    OncoThreads allows researchers find patterns such as effect of treatments, find correlation with
                    treatments
                    and mutation counts, and compare the results across patient cohorts.
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.close}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default AboutModal;