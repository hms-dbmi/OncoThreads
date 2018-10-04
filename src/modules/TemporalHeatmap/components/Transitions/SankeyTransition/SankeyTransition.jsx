import React from 'react';
import {observer} from 'mobx-react';
import Band from './Band'
/*
implements a Sankey Transition (GroupTimepoint to GroupTimepoint)
 */
const SankeyTransition = observer(class SankeyTransition extends React.Component {

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
        const _self = this;
        const rectHeight = 2;

        let transitions = [];
        let rects = [];
        let currXtarget = {};
        let sourcePartitionPos = 0;
        this.props.firstTimepoint.grouped.forEach(function (d, i) {
            const firstParLength = _self.getPartitionLength(d, _self.props.firstPrimary.id);
            let currXsource = sourcePartitionPos;
            rects.push(SankeyTransition.drawHelperRect(sourcePartitionPos, _self.props.visMap.gap, _self.props.groupScale(firstParLength), rectHeight, _self.props.firstPrimary.colorScale(d.partition), d.partition + "source"));

            let targetPartitionPos = 0;
            _self.props.secondTimepoint.grouped.forEach(function (f) {
                if (i === 0) {
                    rects.push(SankeyTransition.drawHelperRect(targetPartitionPos, _self.props.visMap.transitionSpace - rectHeight - _self.props.visMap.gap * 2, _self.props.groupScale(_self.getPartitionLength(f, _self.props.secondPrimary.id)), rectHeight, _self.props.secondPrimary.colorScale(f.partition), f.partition + "target"));
                }
                let transition = _self.getTransition(d.partition, f.partition);
                if (!(f.partition in currXtarget)) {
                    currXtarget[f.partition] = targetPartitionPos
                }
                if (transition.value !== 0) {
                    const transitionWidth = transition.value * (_self.props.groupScale(firstParLength) / firstParLength);
                    transitions.push(<Band {..._self.props} key={d.partition + "->" + f.partition} x0={currXsource}
                                           x1={currXtarget[f.partition]}
                                           width={transitionWidth} rectHeight={rectHeight} firstPartition={d.partition}
                                           secondPartition={f.partition} patients={transition.patients}
                                           count={transition.value}/>);
                    currXsource += transitionWidth;
                    currXtarget[f.partition] += transitionWidth;
                }
                targetPartitionPos += _self.props.groupScale(_self.getPartitionLength(f, _self.props.secondPrimary.id)) + 10;
            });
            sourcePartitionPos += _self.props.groupScale(firstParLength) + 10;
        });
        return [transitions, rects];
    }


    /**
     * gets the length of a partition
     * @param partition
     * @param primaryVariable
     */
    getPartitionLength(partition, primaryVariable) {
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
        return this.props.transition.data.filter(function (d) {
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