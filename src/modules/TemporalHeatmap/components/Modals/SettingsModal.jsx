import React from 'react';
import { inject, observer } from 'mobx-react';
import {
    Button, FormGroup, Modal, Radio,
} from 'react-bootstrap';
import PropTypes from 'prop-types';


/**
 * Modal for choosing settings of the visualization
 * Settings: Visual representation of grouped continuous variables,
 * mode of selection (advanced/simplified), show rows of undefined values
 */
const SettingsModal = inject('uiStore')(observer(class SettingsModal extends React.Component {
    handleApply() {
        this.props.close();
    }

    render() {
        let gradient = false;
        let boxplot = false;
        let median = false;
        if (this.props.uiStore.continuousRepresentation === 'gradient') {
            gradient = true;
        } else if (this.props.uiStore.continuousRepresentation === 'boxplot') {
            boxplot = true;
        } else {
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
                <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <form>
                        <FormGroup>
                            <h5>Show continuous variable distributions in groups as</h5>
                            <Radio
                                checked={gradient}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setContinuousRepresentation('gradient')}
                            >
                                Color Gradients
                            </Radio>
                            {' '}
                            <Radio
                                checked={boxplot}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setContinuousRepresentation('boxplot')}
                            >
                                Boxplots
                            </Radio>
                            {' '}
                            <Radio
                                checked={median}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setContinuousRepresentation('median')}
                            >
                                Median Color
                            </Radio>
                        </FormGroup>
                    </form>
                    <form>
                        <FormGroup>
                            <h5>Selection Type</h5>
                            <Radio
                                checked={this.props.uiStore.advancedSelection}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setAdvancedSelection(true)}
                            >
                                Advanced
                            </Radio>
                            {' '}
                            <Radio
                                checked={!this.props.uiStore.advancedSelection}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setAdvancedSelection(false)}
                            >
                                Simplified
                            </Radio>
                            {' '}
                        </FormGroup>
                    </form>
                    <form>
                        <FormGroup>
                            <h5>Show rows with only undefined values</h5>
                            <Radio
                                checked={this.props.uiStore.showUndefined}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setShowUndefined(true)}
                            >
                                Yes
                            </Radio>
                            {' '}
                            <Radio
                                checked={!this.props.uiStore.showUndefined}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setShowUndefined(false)}
                            >
                                No
                            </Radio>
                            {' '}

                        </FormGroup>
                    </form>
                     <form>
                        <FormGroup>
                            <h5>Align grouped blocks</h5>
                            <Radio
                                checked={this.props.uiStore.blockAlignment==="left"}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setBlockAlignment("left")}
                            >
                                Left
                            </Radio>
                            {' '}
                              <Radio
                                checked={this.props.uiStore.blockAlignment==="middle"}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setBlockAlignment("middle")}
                            >
                                Middle
                            </Radio>
                            {' '}
                              <Radio
                                checked={this.props.uiStore.blockAlignment==="right"}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setBlockAlignment("right")}
                            >
                                Right
                            </Radio>
                            {' '}

                        </FormGroup>
                    </form>
                    <form>
                        <FormGroup>
                            <h5>Experimental: Slanted Lines</h5>
                            <Radio
                                checked={this.props.uiStore.slantedLines === 'singleDir'}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setSlantedLines('singleDir')}
                            >
                                One direction
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.slantedLines === 'altWithin'}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setSlantedLines('altWithin')}
                            >
                                Alternating direction (within variable)
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.slantedLines === 'altAcross'}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setSlantedLines('altAcross')}
                            >
                                Alternating direction (across variables )
                            </Radio>
                            <Radio
                                checked={this.props.uiStore.slantedLines === 'random'}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setSlantedLines('random')}
                            >
                                Random
                            </Radio>
                            <Radio
                                checked={this.props.uiStore.slantedLines === 'none'}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setSlantedLines('none')}
                            >
                                None
                            </Radio>
                        </FormGroup>
                    </form>
                    <form>
                        <FormGroup>
                            <h5>Experimental: Group Stacking</h5>
                            <Radio
                                checked={!this.props.uiStore.horizontalStacking}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setHorizontalStacking(false)}
                            >
                                Vertical
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.horizontalStacking}
                                name="radioGroup"
                                inline
                                onChange={() => this.props.uiStore.setHorizontalStacking(true)}
                            >
                                Horizontal
                            </Radio>
                            {' '}
                        </FormGroup>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.close}>Close</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}));
SettingsModal.propTypes = {
    close: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
};
export default SettingsModal;
