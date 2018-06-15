import React from 'react';
import {observer} from 'mobx-react';
import {Button, ButtonGroup} from 'react-bootstrap';

import Content from "./Content";

/*
sort context menu, appears after a right click on the sort button
 */
const ContextMenuHeatmapRow = observer(class ContextMenuHeatmapRow extends React.Component {
    constructor() {
        super();
        this.goUp = this.goUp.bind(this);
        this.goDown = this.goDown.bind(this);
        //this.applySortToNext = this.applySortToNext.bind(this);
    }

    /**
     * applies sorting of the clicked timepoint to all timepoints
     */
    goUp(patient, timepoint, xposition, y) {
        console.log(patient + ", " + timepoint + ", " + xposition + ", " +y);

        //this.props.rootStore.variablePositions.filter(d=>d.timepoint==timepoint).filter(d=>d.patient==patient)[0].y =
        //this.props.rootStore.variablePositions.filter(d=>d.timepoint==timepoint).filter(d=>d.patient==patient)[0].y - 131;
       
    }

    /**
     * applies sorting of the clicked timepoint to previous timepoint
     */
    goDown(patient, timepoint, xposition, y) {
        console.log(patient + ", " + timepoint + ", " + xposition + ", " +y);
       
        //this.props.rootStore.variablePositions.filter(d=>d.timepoint==timepoint).filter(d=>d.patient==patient)[0].y =
        //this.props.rootStore.variablePositions.filter(d=>d.timepoint==timepoint).filter(d=>d.patient==patient)[0].y+131;
    }

    /**
     * applies sorting of the clicked timepoint to next timepoint
     */
    /*applySortToNext() {
        this.props.store.applySortingToNext(this.props.clickedTimepoint,this.props.clickedVariable);
    }*/

    render() {
        return (
            <ButtonGroup vertical style={{
                visibility: this.props.showContextMenu,
                position: "absolute",
                top: this.props.contextY,
                left: this.props.contextX,

                patient: this.props.patient,
                timepoint: this.props.timepoint,
                xposition: this.props.xposition,
                y: this.props.y

            }}>
                <Button onClick={(e) => this.goUp(this.props.patient, this.props.timepoint, this.props.xposition, this.props.y)}>Up</Button>
                <Button onClick={(e) => this.goDown(this.props.patient, this.props.timepoint, this.props.xposition, this.props.y)}>Down</Button>
                
            </ButtonGroup>
        )
    }
});
export default ContextMenuHeatmapRow;