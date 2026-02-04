import React from 'react';
import { inject, observer } from 'mobx-react';
import {
    Button, Form, Modal,
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
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
                animation={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <form>
                        <Form.Group>
                            <h3>General Settings</h3>
                            <Form.Label>Show continuous variable distributions in groups as:</Form.Label>
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.continuousRepresentation === 'gradient'}
                                name="distributions"
                                onChange={() => this.props.uiStore.setContinuousRepresentation('gradient')}
                                label="Color Gradients"
                            />
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.continuousRepresentation === 'boxplot'}
                                name="distributions"
                                onChange={() => this.props.uiStore.setContinuousRepresentation('boxplot')}
                                label="Boxplots"
                            />
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.continuousRepresentation === 'median'}
                                name="distributions"
                                onChange={() => this.props.uiStore.setContinuousRepresentation('median')}
                                label="Median Color"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Undefined Values</Form.Label>
                            {' '}
                            <Form.Check
                                type="checkbox"
                                checked={this.props.uiStore.showUndefined}
                                name="undefValues"
                                onChange={() => this.props.uiStore
                                    .setShowUndefined(!this.props.uiStore.showUndefined)}
                                label="Show rows with only undefined values"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Align grouped blocks:</Form.Label>
                            {' '}
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.blockAlignment === 'left'}
                                name="alignment"
                                onChange={() => this.props.uiStore.setBlockAlignment('left')}
                                label="Left"
                            />
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.blockAlignment === 'middle'}
                                name="alignment"
                                onChange={() => this.props.uiStore.setBlockAlignment('middle')}
                                label="Middle"
                            />
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.blockAlignment === 'right'}
                                name="alignment"
                                onChange={() => this.props.uiStore.setBlockAlignment('right')}
                                label="Right"
                            />

                        </Form.Group>
                    </form>
                    <h3>Experimental Settings</h3>
                    <form>
                        <Form.Group>
                            <Form.Label>Row offset (pixels)</Form.Label>
                            <Form.Control
                                onChange={e => this.props.uiStore.setRowOffset(e.target.value)}
                                type="number"
                                name="offset"
                                value={this.props.uiStore.rowOffset}
                                step="1"
                                min="0"
                                max="10"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Horizontal gap size (pixels)</Form.Label>
                            <Form.Control
                                onChange={e => this.props.uiStore.setHorizontalGap(e.target.value)}
                                type="number"
                                name="gapSize"
                                value={this.props.uiStore.horizontalGap}
                                step="1"
                                min="0"
                                max="10"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Group stacking:</Form.Label>
                            {' '}
                            <Form.Check
                                type="radio"
                                inline
                                checked={!this.props.uiStore.horizontalStacking}
                                name="stacking"
                                onChange={() => this.props.uiStore.setHorizontalStacking(false)}
                                label="Vertical"
                            />
                            <Form.Check
                                type="radio"
                                inline
                                checked={this.props.uiStore.horizontalStacking}
                                name="stacking"
                                onChange={() => this.props.uiStore.setHorizontalStacking(true)}
                                label="Horizontal"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Draw slanted lines</Form.Label>
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.slantedLines === 'singleDir'}
                                disabled={this.props.uiStore.horizontalStacking}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('singleDir')}
                                label="One direction"
                            />
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.slantedLines === 'altWithin'}
                                disabled={this.props.uiStore.horizontalStacking}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('altWithin')}
                                label="Alternating direction (within variable)"
                            />
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.slantedLines === 'altAcross'}
                                disabled={this.props.uiStore.horizontalStacking}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('altAcross')}
                                label="Alternating direction (across variables )"
                            />
                            <Form.Check
                                type="radio"
                                checked={this.props.uiStore.slantedLines === 'random'}
                                disabled={this.props.uiStore.horizontalStacking}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('random')}
                                label="Random"
                            />
                            <Form.Check
                                type="radio"
                                disabled={this.props.uiStore.horizontalStacking}
                                checked={this.props.uiStore.slantedLines === 'none'}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('none')}
                                label="None"
                            />
                        </Form.Group>
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
