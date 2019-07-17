import React from 'react';
import { inject, observer } from 'mobx-react';
import {
    Button, Checkbox, ControlLabel, FormControl, FormGroup, Modal, Radio,
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
            >
                <Modal.Header closeButton>
                    <Modal.Title>Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <form>
                        <FormGroup>
                            <h3>General Settings</h3>
                            <ControlLabel>Show continuous variable distributions in groups as:</ControlLabel>
                            <Radio
                                checked={this.props.uiStore.continuousRepresentation === 'gradient'}
                                name="distributions"
                                onChange={() => this.props.uiStore.setContinuousRepresentation('gradient')}
                            >
                                Color Gradients
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.continuousRepresentation === 'boxplot'}
                                name="distributions"
                                onChange={() => this.props.uiStore.setContinuousRepresentation('boxplot')}
                            >
                                Boxplots
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.continuousRepresentation === 'median'}
                                name="distributions"
                                onChange={() => this.props.uiStore.setContinuousRepresentation('median')}
                            >
                                Median Color
                            </Radio>
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel>Undefined Values</ControlLabel>
                            {' '}
                            <Checkbox
                                checked={this.props.uiStore.showUndefined}
                                name="undefValues"
                                onChange={() => this.props.uiStore
                                    .setShowUndefined(!this.props.uiStore.showUndefined)}
                            >
                                Show rows with only undefined values
                            </Checkbox>
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel>Align grouped blocks:</ControlLabel>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.blockAlignment === 'left'}
                                name="alignment"
                                onChange={() => this.props.uiStore.setBlockAlignment('left')}
                            >
                                Left
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.blockAlignment === 'middle'}
                                name="alignment"
                                onChange={() => this.props.uiStore.setBlockAlignment('middle')}
                            >
                                Middle
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.blockAlignment === 'right'}
                                name="alignment"
                                onChange={() => this.props.uiStore.setBlockAlignment('right')}
                            >
                                Right
                            </Radio>
                            {' '}

                        </FormGroup>
                    </form>
                    <h3>Experimental Settings</h3>
                    <form>
                        <FormGroup>
                            <ControlLabel>Row offset (pixels)</ControlLabel>
                            <FormControl
                                onChange={e => this.props.uiStore.setRowOffset(e.target.value)}
                                type="number"
                                name="offset"
                                value={this.props.uiStore.rowOffset}
                                step="1"
                                min="0"
                                max="10"
                            />
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel>Horizontal gap size (pixels)</ControlLabel>
                            <FormControl
                                onChange={e => this.props.uiStore.setHorizontalGap(e.target.value)}
                                type="number"
                                name="gapSize"
                                value={this.props.uiStore.horizontalGap}
                                step="1"
                                min="0"
                                max="10"
                            />
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel>Group stacking:</ControlLabel>
                            {' '}
                            <Radio
                                checked={!this.props.uiStore.horizontalStacking}
                                name="stacking"
                                inline
                                onChange={() => this.props.uiStore.setHorizontalStacking(false)}
                            >
                                Vertical
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.horizontalStacking}
                                name="stacking"
                                inline
                                onChange={() => this.props.uiStore.setHorizontalStacking(true)}
                            >
                                Horizontal
                            </Radio>
                            {' '}
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel>Draw slanted lines</ControlLabel>
                            <Radio
                                checked={this.props.uiStore.slantedLines === 'singleDir'}
                                disabled={this.props.uiStore.horizontalStacking}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('singleDir')}
                            >
                                One direction
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.slantedLines === 'altWithin'}
                                disabled={this.props.uiStore.horizontalStacking}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('altWithin')}
                            >
                                Alternating direction (within variable)
                            </Radio>
                            {' '}
                            <Radio
                                checked={this.props.uiStore.slantedLines === 'altAcross'}
                                disabled={this.props.uiStore.horizontalStacking}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('altAcross')}
                            >
                                Alternating direction (across variables )
                            </Radio>
                            <Radio
                                checked={this.props.uiStore.slantedLines === 'random'}
                                disabled={this.props.uiStore.horizontalStacking}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('random')}
                            >
                                Random
                            </Radio>
                            <Radio
                                disabled={this.props.uiStore.horizontalStacking}
                                checked={this.props.uiStore.slantedLines === 'none'}
                                name="slanted"
                                onChange={() => this.props.uiStore.setSlantedLines('none')}
                            >
                                None
                            </Radio>
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
