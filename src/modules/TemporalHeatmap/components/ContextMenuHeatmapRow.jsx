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
        //this.applySortToNext = this.applySortToNext.bind(this);
    }

    /**
     * applies sorting of the clicked timepoint to all timepoints
     */
    goUp(patient, timepoint, xposition) {
        //console.log("Go up");

        for(var i=0; i<this.props.rootStore.timepointStore.selectedPatients.length; i++){

            //this.props.rootStore.moveTimepointUpDown(this.props.rootStore.maxTP, patient, xposition, 0 );


            var p=this.props.rootStore.timepointStore.selectedPatients[i];

            var findtimeline=0;
            var flag=false;

            var len = this.props.rootStore.timepointStructure.length;

            for(let j=len-1; j>=0; j--){
                var list = this.props.rootStore.timepointStructure[j];
                
                for(let k=0; k<list.length; k++){
                    if(list[k].patient===p){
                        flag=true; 
                        //console.log(list[k].patient); 
                        findtimeline=j;
                        break;
                    }
                    
                }
                if(flag){
                    break;
                }
            
            }

            this.props.rootStore.updateTimepointStructure(this.props.rootStore.maxTP, p, findtimeline, xposition, 1 )
        }
        
        //this.props.rootStore.variablePositions.filter(d=>d.timepoint==timepoint).filter(d=>d.patient==patient)[0].y =
        //this.props.rootStore.variablePositions.filter(d=>d.timepoint==timepoint).filter(d=>d.patient==patient)[0].y - 131;
        this.props.rootStore.undoRedoStore.saveTPMovement("up",patient);
       
    }

    /**
     * applies sorting of the clicked timepoint to previous timepoint
     */
    goDown(patient, timepoint, xposition) {
        //console.log("Go down");
        //console.log(patient + ", " + timepoint + ", " + xposition );

        //for(var i=0; i<this.props.rootStore.timepointStore.selectedPatients.length; i++){
        for(var i=this.props.rootStore.timepointStore.selectedPatients.length-1; i>=0; i--){

            //this.props.rootStore.moveTimepointUpDown(this.props.rootStore.maxTP, patient, xposition, 0 );


            var p=this.props.rootStore.timepointStore.selectedPatients[i];

            var findtimeline=0;
            var flag=false;

            var len = this.props.rootStore.timepointStructure.length;

            for(let j=0; j<len; j++){
                var list = this.props.rootStore.timepointStructure[j];
                
                for(let k=0; k<list.length; k++){
                    if(list[k].patient===p){
                        flag=true; 
                        //console.log(list[k].patient); 
                        findtimeline=j;
                        break;
                    }
                    
                }
                if(flag){
                    break;
                }
            
            }
            
            //console.log(findtimeline);

            this.props.rootStore.updateTimepointStructure(this.props.rootStore.maxTP, p, findtimeline, xposition, 0 )
            this.props.rootStore.undoRedoStore.saveTPMovement("down",patient);
        }
        //this.props.rootStore.updateTimepointStructure(this.props.rootStore.maxTP, patient, timepoint, xposition, 0 )
       
        //var k=this.props.rootStore.timepointStore.timepoints;

       /* k.push(k[k.length-1]);

        k[3].heatmap[0].data[0].push({
            patient: patient,
            value: "III"
        });*/

       // k[3].patients.push(patient);

       // k[0].patients.pop(patient);

        //k[3].patients.push("P01");
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
                xposition: this.props.xposition
                
            }}>
                <Button onClick={() => this.goUp(this.props.patient, this.props.timepoint, this.props.xposition)}>Up</Button>
                <Button onClick={() => this.goDown(this.props.patient, this.props.timepoint, this.props.xposition)}>Down</Button>
                
            </ButtonGroup>
        )
    }
});
export default ContextMenuHeatmapRow;