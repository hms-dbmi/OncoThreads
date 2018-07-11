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
        this.goUp = this.goUp.bind(this);
        this.goDown = this.goDown.bind(this);
    }

    /**
     * applies sorting of the clicked timepoint to all timepoints
     */
    goUp(patient) {
        //console.log("Go up");
        if (this.props.rootStore.timepointStore.selectedPatients.length === 0) {
            this.moveSinglePatientUp(patient);
            this.props.rootStore.undoRedoStore.saveTPMovement("up", patient);
        }
        else {
            for (var i = 0; i < this.props.rootStore.timepointStore.selectedPatients.length; i++) {

                var p = this.props.rootStore.timepointStore.selectedPatients[i];

                this.moveSinglePatientUp(p);
            }
            this.props.rootStore.undoRedoStore.saveTPMovement("up", this.props.rootStore.timepointStore.selectedPatients);

        }

    }

    moveSinglePatientUp(patient) {
        var findtimeline = 0;
        var flag = false;
        var len = this.props.rootStore.timepointStructure.length;
        for (let j = len - 1; j >= 0; j--) {
            var list = this.props.rootStore.timepointStructure[j];
            for (let k = 0; k < list.length; k++) {
                if (list[k].patient === patient) {
                    flag = true;
                    //console.log(list[k].patient);
                    findtimeline = j;
                    break;
                }

            }
            if (flag) {
                break;
            }

        }
        this.props.rootStore.updateTimepointStructure(patient, findtimeline, 1)
    }

    /**
     * applies sorting of the clicked timepoint to previous timepoint
     */
    goDown(patient) {
        if (this.props.rootStore.timepointStore.selectedPatients.length === 0) {
            this.moveSinglePatientDown(patient);
            this.props.rootStore.undoRedoStore.saveTPMovement("down", patient);
        }
        else {
            for (var i = this.props.rootStore.timepointStore.selectedPatients.length - 1; i >= 0; i--) {

                //this.props.rootStore.moveTimepointUpDown(this.props.rootStore.maxTP, patient, xposition, 0 );


                var p = this.props.rootStore.timepointStore.selectedPatients[i];

                this.moveSinglePatientDown(p);
            }
            this.props.rootStore.undoRedoStore.saveTPMovement("down", this.props.rootStore.timepointStore.selectedPatients);

        }

    }

    moveSinglePatientDown(patient) {
        var findtimeline = 0;
        var flag = false;

        var len = this.props.rootStore.timepointStructure.length;

        for (let j = 0; j < len; j++) {
            var list = this.props.rootStore.timepointStructure[j];

            for (let k = 0; k < list.length; k++) {
                if (list[k].patient === patient) {
                    flag = true;
                    //console.log(list[k].patient);
                    findtimeline = j;
                    break;
                }

            }
            if (flag) {
                break;
            }

        }

        //console.log(findtimeline);

        this.props.rootStore.updateTimepointStructure(patient, findtimeline, 0);
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
                    onClick={() => this.goUp(this.props.patient)}> Move patient(s)
                    up by 1 timepoint</Button>
                <Button
                    onClick={() => this.goDown(this.props.patient)}>Move
                    patient(s) down by 1 timepoint</Button>
            </ButtonGroup>
        )
    }
});
export default ContextMenuHeatmapRow;