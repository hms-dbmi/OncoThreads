import React from 'react';
import {inject, observer} from 'mobx-react';
import Band from './Band'
/*
implements a Sankey Transition (GroupTimepoint to GroupTimepoint)
 */
const SankeyTransition = inject("dataStore", "visStore")(observer(class SankeyTransition extends React.Component {

    /**
     * draws a small rectangle to repeat the color of a partition with the primary Variable
     * @param x position
     * @param y position
     * @param width of rect
     * @param height of rect
     * @param color color of rect
     * @param key (unique)
     * @returns rectangle
     */
    static drawHelperRect(x, y, width, height, color, key) {
        return (<rect key={key} x={x} y={y} width={width} height={height} fill={color}/>)
    }

    /**
     * draws transitions between all partitions of the first and the second timepoint
     * @returns []: transitions
     */
    drawTransitions() {
        let transitions = [];
        let rects = [];
        let currXtarget = {};
        let sourcePartitionPos = 0;
        this.props.firstGrouped.forEach((sourcePartition, i) => {
            let currXsource = sourcePartitionPos;
            rects.push(SankeyTransition.drawHelperRect(sourcePartitionPos, this.props.visStore.gap, this.props.groupScale(sourcePartition.patients.length), this.props.visStore.helperRectHeight, this.props.firstPrimary.colorScale(sourcePartition.partition), sourcePartition.partition + "source"));
            let targetPartitionPos = 0;
            this.props.secondGrouped.forEach(targetPartition => {
                if (i === 0) {
                    rects.push(SankeyTransition.drawHelperRect(targetPartitionPos, this.props.visStore.transitionSpace - this.props.visStore.helperRectHeight - this.props.visStore.gap, this.props.groupScale(targetPartition.patients.length), this.props.visStore.helperRectHeight, this.props.secondPrimary.colorScale(targetPartition.partition), targetPartition.partition + "target"));
                }
                let patientIntersection = sourcePartition.patients.filter(patient => targetPartition.patients.includes(patient));
                if (!(targetPartition.partition in currXtarget)) {
                    currXtarget[targetPartition.partition] = targetPartitionPos
                }
                if (patientIntersection.length !== 0) {
                    const transitionWidth = patientIntersection.length * (this.props.groupScale(sourcePartition.patients.length) / sourcePartition.patients.length);
                    transitions.push(
                        <Band key={sourcePartition.partition + "->" + targetPartition.partition}
                              x0={currXsource}
                              x1={currXtarget[targetPartition.partition]}
                              {...this.props.tooltipFunctions}
                              width={transitionWidth}
                              firstPartition={sourcePartition.partition}
                              secondPartition={targetPartition.partition}
                              patients={patientIntersection}
                              firstPrimary={this.props.firstPrimary}
                              secondPrimary={this.props.secondPrimary}
                        />);
                    currXsource += transitionWidth;
                    currXtarget[targetPartition.partition] += transitionWidth;
                }
                targetPartitionPos += this.props.groupScale(targetPartition.patients.length) + 10;
            });
            sourcePartitionPos += this.props.groupScale(sourcePartition.patients.length) + 10;
        });
        return [transitions, rects];
    }


    render() {
        return (
            this.drawTransitions()
        )
    }
}));
export default SankeyTransition;