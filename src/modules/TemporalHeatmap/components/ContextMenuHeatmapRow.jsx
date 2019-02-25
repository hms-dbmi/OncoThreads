import React from 'react';
import {observer} from 'mobx-react';
import {Button, ButtonGroup} from 'react-bootstrap';

//import Content from "./Content";

/*
sort context menu, appears after a right click on the sort button
 */
const ContextMenuHeatmapRow = observer(class ContextMenuHeatmapRow extends React.Component {
    constructor() {
        super();
        this.move = this.move.bind(this);
    }

    move(patient, isUp) {
        if (this.props.rootStore.dataStore.selectedPatients.length === 0) {
            this.props.rootStore.updateTimepointStructure([patient], this.props.timepoint, isUp);
            this.props.rootStore.undoRedoStore.saveTPMovement(isUp ? "UP" : "DOWN", patient);
        }
        else {
            this.props.rootStore.updateTimepointStructure(this.props.rootStore.dataStore.selectedPatients, this.props.timepoint, isUp);
            this.props.rootStore.undoRedoStore.saveTPMovement(isUp ? "UP" : "DOWN", this.props.rootStore.dataStore.selectedPatients);
        }
    }

    render() {
        return (
            <ButtonGroup vertical style={{
                visibility: this.props.showContextMenu,
                position: "absolute",
                top: this.props.contextY,
                left: this.props.contextX,

                patient: this.props.patient,
                timepoint: this.props.timepoint,
                xposition: this.props.xposition

            }}>
                <Button
                    onClick={() => this.move(this.props.patient, true)}> Move patient(s)
                    up by 1 timepoint</Button>
                <Button
                    onClick={() => this.move(this.props.patient, false)}>Move
                    patient(s) down by 1 timepoint</Button>
            </ButtonGroup>
        )
    }
});
export default ContextMenuHeatmapRow;