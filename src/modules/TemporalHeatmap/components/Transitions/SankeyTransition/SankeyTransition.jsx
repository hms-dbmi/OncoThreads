import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Band from './Band';
import Proxies from '../Proxies';
import OriginalVariable from '../../../stores/OriginalVariable';
import DerivedVariable from '../../../stores/DerivedVariable';


/**
 * Component for a transition between grouped timepoints ("Sankey Transition")
 */
const SankeyTransition = inject('dataStore', 'visStore', 'uiStore')(observer(class SankeyTransition extends React.Component {
    /**
     * get the offset corresponding to the current UI block align setting
     * @param {number} offsetPatients
     * @return {number}
     */
    getOffset(offsetPatients) {
        switch (this.props.uiStore.blockAlignment) {
        case 'left':
            return 0;
        case 'middle':
            return this.props.visStore
                .groupScale(offsetPatients) / 2;
        default:
            return this.props.visStore
                .groupScale(offsetPatients);
        }
    }

    /**
     * draws transitions between all partitions of the first and the second timepoint
     * @returns {*[]}
     */
    drawTransitions() {
        const transitions = [];
        const currXtarget = {};
        let initialSourcePosition = this.props.visStore.getTpXTransform(this.props.index);

        // proxy positions for source timepoint
        const sourceProxyPositions = [];

        // proxy positions for target timepoint
        const targetProxyPositions = [];
        let sourceProxies = null;
        let targetProxies = null;
        let sourceCounter = 0;

        // iterate through source partitions
        this.props.firstGrouped.forEach((sourcePartition) => {
            const sharedSourcePatients = sourcePartition.patients
                .filter(patient => [].concat(...this.props.secondGrouped
                    .map(partition => partition.patients)).includes(patient));
            if (sharedSourcePatients.length > 0) {
                const firstOffset = this.getOffset(sourcePartition.patients.length
                    - sharedSourcePatients.length);
                sourceProxyPositions.push({
                    key: sourcePartition.partition,
                    x0: initialSourcePosition,
                    offset: firstOffset,
                    sharedWidth: this.props.visStore.groupScale(sharedSourcePatients.length),
                    width: this.props.visStore.groupScale(sourcePartition.patients.length),
                    selected: [],
                });
                let currXsource = initialSourcePosition;
                let initialTargetPosition = this.props.visStore
                    .getTpXTransform(this.props.index + 1);
                let targetCounter = 0;

                // iterate through target partitions
                this.props.secondGrouped.forEach((targetPartition) => {
                    const sharedTargetPatients = targetPartition.patients
                        .filter(patient => [].concat(...this.props.firstGrouped
                            .map(partition => partition.patients)).includes(patient));
                    if (sharedTargetPatients.length > 0) {
                        const patientIntersection = sourcePartition.patients
                            .filter(patient => targetPartition.patients.includes(patient));
                        if (!(targetPartition.partition in currXtarget)) {
                            const secondOffset = this.getOffset(targetPartition.patients.length
                                    - sharedTargetPatients.length);
                            currXtarget[targetPartition.partition] = initialTargetPosition
                                + secondOffset;
                            targetProxyPositions.push({
                                key: targetPartition.partition,
                                x0: initialTargetPosition,
                                offset: secondOffset,
                                sharedWidth: this.props.visStore
                                    .groupScale(sharedTargetPatients.length),
                                width: this.props.visStore
                                    .groupScale(targetPartition.patients.length),
                                selected: [],
                            });
                        }

                        // draw band between source and target
                        if (patientIntersection.length > 0) {
                            const transitionWidth = patientIntersection.length
                                * (this.props.visStore.groupScale(sourcePartition.patients.length)
                                    / sourcePartition.patients.length);
                            transitions.push(
                                <Band
                                    key={`${sourcePartition.partition}->${targetPartition.partition}`}
                                    x0={currXsource + firstOffset}
                                    x1={currXtarget[targetPartition.partition]}
                                    height={this.props.visStore.transitionSpaces[this.props.index]}
                                    width={transitionWidth}
                                    firstPartition={sourcePartition.partition}
                                    secondPartition={targetPartition.partition}
                                    patients={patientIntersection}
                                    firstPrimary={this.props.firstPrimary}
                                    secondPrimary={this.props.secondPrimary}
                                    {...this.props.tooltipFunctions}
                                />,
                            );

                            // add selected portion to proxy arrays
                            const selectedIntersection = patientIntersection
                                .filter(patient => this.props.dataStore.selectedPatients
                                    .includes(patient));
                            if (selectedIntersection.length > 0) {
                                const selectedWidth = selectedIntersection.length
                                    * (this.props.visStore
                                        .groupScale(sourcePartition.patients.length)
                                        / sourcePartition.patients.length);
                                sourceProxyPositions[sourceCounter].selected.push([
                                    currXsource + firstOffset,
                                    currXsource + selectedWidth + firstOffset,
                                ]);
                                targetProxyPositions[targetCounter].selected.push([
                                    currXtarget[targetPartition.partition],
                                    currXtarget[targetPartition.partition] + selectedWidth,
                                ]);
                            }
                            currXsource += transitionWidth;
                            currXtarget[targetPartition.partition] += transitionWidth;
                        }
                        targetCounter += 1;
                    }
                    initialTargetPosition += this.props.visStore
                        .groupScale(targetPartition.patients.length)
                        + this.props.visStore.partitionGap;
                });
                sourceCounter += 1;
            }
            initialSourcePosition += this.props.visStore
                .groupScale(sourcePartition.patients.length)
                + this.props.visStore.partitionGap;
            // only create proxies for vertical stacking
            if (!this.props.uiStore.horizontalStacking) {
                sourceProxies = (
                    <Proxies
                        key="source"
                        proxyPositions={sourceProxyPositions}
                        bandRectY={this.props.uiStore.horizontalGap
                            + this.props.visStore.colorRectHeight}
                        colorRectY={this.props.uiStore.horizontalGap}
                        colorScale={this.props.firstPrimary.colorScale}
                        inverse={false}
                    />
                );
                targetProxies = (
                    <Proxies
                        key="target"
                        proxyPositions={targetProxyPositions}
                        bandRectY={this.props.visStore.transitionSpaces[this.props.index]
                            - this.props.visStore.colorRectHeight
                            - this.props.uiStore.horizontalGap - this.props.visStore.bandRectHeight}
                        colorRectY={this.props.visStore.transitionSpaces[this.props.index]
                            - this.props.visStore.colorRectHeight
                            - this.props.uiStore.horizontalGap}
                        colorScale={this.props.secondPrimary.colorScale}
                        inverse
                    />
                );
            }
        });
        return (
            <g>
                {transitions}
                {sourceProxies}
                {targetProxies}
            </g>
        );
    }


    render() {
        return (
            this.drawTransitions()
        );
    }
}));
SankeyTransition.propTypes = {
    index: PropTypes.number.isRequired,
    firstGrouped: PropTypes.arrayOf(PropTypes.object).isRequired,
    secondGrouped: PropTypes.arrayOf(PropTypes.object).isRequired,
    firstPrimary: PropTypes.oneOfType([PropTypes.instanceOf(OriginalVariable),
        PropTypes.instanceOf(DerivedVariable)]).isRequired,
    secondPrimary: PropTypes.oneOfType([PropTypes.instanceOf(OriginalVariable),
        PropTypes.instanceOf(DerivedVariable)]).isRequired,
    tooltipFunctions: PropTypes.objectOf(PropTypes.func),
};
export default SankeyTransition;
