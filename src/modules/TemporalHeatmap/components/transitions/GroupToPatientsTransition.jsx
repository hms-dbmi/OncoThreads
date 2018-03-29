import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';

const GroupToPatientsTransition = observer(class GroupToPatientsTransition extends React.Component {
    constructor() {
        super();
    }

    /**
     * draws a single transition
     * @param x0: start point on source partition
     * @param x1: start point on target partition
     * @param x2
     * @param y0
     * @param y1
     * @param key: unique transition key
     * @returns transition path
     */
    static drawTransition(x0, x1,x2,y0,y1, key) {
        const line = d3.path();
        line.moveTo(x0, y0);
        line.lineTo(x1,y0);
        line.lineTo(x2, y1);
        line.closePath();
        return (<path key={key} d={line.toString()} stroke={"lightgray"} fill={"lightgray"} opacity={0.5}/>)
    }
    static drawHelperRect(x, y, width, height, color){
        return(<rect x={x} y={y} width={width} height={height} fill={color}/>)
    }

    /**
     * draws all transitons
     * @returns {Array}
     */
    drawTransitions() {
        let reverse=this.isReverse();
        let grouped, scale, y0, y1, primary;
        if (reverse) {
            grouped = this.props.secondTimepoint.group;
            scale=this.props.firstHeatmapScale;
            y0 = this.props.height;
            y1 = 0;
            primary=this.props.secondPrimary
        }
        else {
            grouped = this.props.firstTimepoint.group;
            scale=this.props.secondHeatmapScale;
            y0 = 0;
            y1 = this.props.height;
            primary=this.props.firstPrimary
        }
        console.log(grouped);
        let transitions = [];
        let rects=[];
        const _self = this;
        let sourcePartitionPos = 0;
        grouped.forEach(function (d) {
            let currXsource = sourcePartitionPos;
            const partitionLength = _self.getPartitionLength(d, primary);
            //rects.push(GroupToPatientsTransition.drawHelperRect(sourcePartitionPos,y0,_self.props.groupScale(partitionLength),5,_self.props.color(d.partition)));
                let transitionPatients = _self.getTransitionPatients(d.partition,reverse);
                if (transitionPatients.length !== 0) {
                    const transitionWidth = _self.props.groupScale(partitionLength) / partitionLength;
                    transitionPatients.forEach(function (f) {
                        transitions.push(GroupToPatientsTransition.drawTransition(currXsource,currXsource+transitionWidth, scale(f)+0.5*_self.props.rectWidth,y0,y1, d.partition + "" + f));
                        currXsource += transitionWidth;
                    });
                }
                sourcePartitionPos += _self.props.groupScale(partitionLength) + 10;
            });
        return [transitions,rects];
    }
    isReverse(){
        return (!(typeof this.props.transition.data[0].from==="string"))
    }

    /**
     * gets the length of a partition
     * @param partition
     * @param primaryVariable
     */
    getPartitionLength(partition, primaryVariable) {
        const _self = this;
        return partition.rows.filter(function (e) {
            return e.variable === primaryVariable;
        })[0].counts[0].value;
    }

    getTransitionPatients(partition,reverse) {
        if(!reverse)
        return this.props.transition.data.filter(function (d, i) {
            return d.from === partition
        })[0].to;
        else return this.props.transition.data.filter(function (d, i) {
            return d.to === partition
        })[0].from;
    }


    render() {

        return (
            this.drawTransitions()
        )
    }
});
export default GroupToPatientsTransition;