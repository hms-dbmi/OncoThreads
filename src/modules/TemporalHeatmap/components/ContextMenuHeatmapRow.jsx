import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Button, ButtonGroup } from 'react-bootstrap';
/**
 * Component for Context Menu for moving patients up/down
 */
const ContextMenuHeatmapRow = inject('rootStore', 'undoRedoStore')(observer(class ContextMenuHeatmapRow extends React.Component {
    constructor() {
        super();
        this.move = this.move.bind(this);
    }

    /**
     * moves single patient of all selected patients
     * @param {string} patient
     * @param {boolean} isUp - move up (true) or down (false)
     */
    move(patient, isUp) {
        if (this.props.rootStore.dataStore.selectedPatients.length === 0) {
            this.props.rootStore.updateTimepointStructure([patient], this.props.timepoint, isUp);
            this.props.undoRedoStore.saveTPMovement(isUp ? 'UP' : 'DOWN', patient);
        } else {
            this.props.rootStore.updateTimepointStructure(this.props.rootStore
                .dataStore.selectedPatients, this.props.timepoint, isUp);
            this.props.undoRedoStore.saveTPMovement(isUp ? 'UP' : 'DOWN', this.props.rootStore.dataStore.selectedPatients);
        }
    }

    render() {
        return (
            <ButtonGroup
                vertical
                style={{
                    visibility: this.props.showContextMenu ? 'visible' : 'hidden',
                    position: 'absolute',
                    top: this.props.contextY,
                    left: this.props.contextX,
                }}
            >
                <Button
                    onClick={() => this.move(this.props.patient, true)}
                >
                    Move patient(s) up by 1 timepoint
                </Button>
                <Button
                    onClick={() => this.move(this.props.patient, false)}
                >
                    Move patient(s) down by 1 timepoint
                </Button>
            </ButtonGroup>
        );
    }
}));
ContextMenuHeatmapRow.propTypes = {
    contextX: PropTypes.number.isRequired,
    contextY: PropTypes.number.isRequired,
    patient: PropTypes.string,
    timepoint: PropTypes.number.isRequired,
    showContextMenu: PropTypes.bool.isRequired,
};
export default ContextMenuHeatmapRow;
