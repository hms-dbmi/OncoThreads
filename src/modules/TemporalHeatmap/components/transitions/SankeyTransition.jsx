import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';

const SankeyTransition = observer(class SankeyTransition extends React.Component {
    constructor() {
        super();
    }

    /**
     * draws a single transition
     * @param x0: start point on source partition
     * @param x1: start point on target partition
     * @param width: of transition
     * @param key: unique transition key
     * @returns transition path
     */
    drawTransition(x0, x1, width, key) {
        const line = d3.path();
        line.moveTo(x0, 0);
        line.lineTo(x1, this.props.height-2);
        line.lineTo(x1 + width, this.props.height-2);
        line.lineTo(x0 + width, 0);
        line.closePath();
        return (<path key={key} d={line.toString()} stroke={"lightgray"} fill={"lightgray"} opacity={0.5}/>)
    }

    /**
     * draws all transitons
     * @returns {Array}
     */
    drawTransitions() {
        let transitions = [];
        let currXtarget = {};
        const _self = this;
        let sourcePartitionPos = 0;
        this.props.firstTimepoint.group.forEach(function (d){
            let currXsource=sourcePartitionPos;
            const firstParLength=_self.getPartitionLength(d,_self.props.firstPrimary);
            let targetPartitionPos=0;
            _self.props.secondTimepoint.group.forEach(function (f) {
                let transition = _self.getTransition(d.partition, f.partition);
                if (!(f.partition in currXtarget)) {
                    currXtarget[f.partition] = targetPartitionPos
                }
                if (transition.value !== 0) {
                    const transitionWidth = transition.value * (_self.props.groupScale(firstParLength) / firstParLength);
                    transitions.push(_self.drawTransition(currXsource, currXtarget[f.partition], transitionWidth, d.partition + "" + f.partition));
                    currXsource += transitionWidth;
                    currXtarget[f.partition] += transitionWidth;
                }
                targetPartitionPos+=_self.props.groupScale(_self.getPartitionLength(f,_self.props.secondPrimary)) +10;
            });
            sourcePartitionPos += _self.props.groupScale(firstParLength) + 10;
        });
        return transitions;
    }

    /**
     * gets the length of a partition
     * @param partition
     * @param primaryVariable
     */
    getPartitionLength(partition,primaryVariable){
        const _self=this;
        return partition.rows.filter(function (e) {
                return e.variable === primaryVariable;
            })[0].counts[0].value;
    }

    /**
     * gets counts for transition from source partition to target partition
     * @param source
     * @param target
     */
    getTransition(source, target) {
        return this.props.transition.data.filter(function (d, i) {
            return d.from === source && d.to === target
        })[0]
    }


    render() {
        return (
            this.drawTransitions()
        )
    }
});
export default SankeyTransition;