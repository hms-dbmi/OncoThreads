import React from 'react';
import {observer,inject} from 'mobx-react';
import {Button, Modal,Radio,FormGroup} from 'react-bootstrap';


const SettingsModal = inject("uiStore")(observer(class SettingsModal extends React.Component {

    handleApply() {
        this.props.close();
    }

    render() {
        let gradient = false;
        let boxplot = false;
        let median = false;
        if (this.props.uiStore.continuousRepresentation === "gradient") {
            gradient = true;
        }
        else if (this.props.uiStore.continuousRepresentation === "boxplot") {
            boxplot = true;
        }
        else {
            median = true;
        }
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{'maxHeight': '400px', 'overflowY': 'auto'}}>
                    <form>
                        <FormGroup>
                            <h5>Show continuous variable distributions in groups as</h5>
                            <Radio checked={gradient} name="radioGroup" inline
                                   onChange={() => this.props.uiStore.setContinuousRepresentation('gradient')}>
                                Color Gradients
                            </Radio>{' '}
                            <Radio checked={boxplot} name="radioGroup" inline
                                   onChange={() => this.props.uiStore.setContinuousRepresentation('boxplot')}>
                                Boxplots
                            </Radio>{' '}
                            <Radio checked={median} name="radioGroup" inline
                                   onChange={() => this.props.uiStore.setContinuousRepresentation('median')}>
                                Median Color
                            </Radio>
                        </FormGroup>
                    </form>
                    <form>
                        <FormGroup>
                            <h5>Selection Type</h5>
                            <Radio checked={this.props.uiStore.advancedSelection} name="radioGroup" inline
                                   onChange={() => this.props.uiStore.setAdvancedSelection(true)}>
                                Advanced
                            </Radio>{' '}
                            <Radio checked={!this.props.uiStore.advancedSelection} name="radioGroup" inline
                                   onChange={() => this.props.uiStore.setAdvancedSelection(false)}>
                                Simplified
                            </Radio>{' '}
                        </FormGroup>
                    </form>
                    <form>
                        <FormGroup>
                            <h5>Show rows with only undefined values</h5>
                            <Radio checked={this.props.uiStore.showUndefined} name="radioGroup" inline
                                   onChange={() => this.props.uiStore.setShowUndefined(true)}>
                                Yes
                            </Radio>{' '}
                            <Radio checked={!this.props.uiStore.showUndefined} name="radioGroup" inline
                                   onChange={() => this.props.uiStore.setShowUndefined(false)}>
                                No
                            </Radio>{' '}

                        </FormGroup>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.close}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}));
export default SettingsModal;