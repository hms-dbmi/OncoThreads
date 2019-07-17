import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer, Provider } from 'mobx-react';
import TimelineTimepoint from './Timepoints/GlobalTimeline/TimelineTimepoint';
import GlobalTransition from './Transitions/GlobalTransition';


/**
 * Component for global timeline
 */
const GlobalTimeline = inject('rootStore')(observer(class GlobalTimeline extends React.Component {
    constructor() {
        super();
        this.globalTime = React.createRef();
        this.updateDimensions = this.updateDimensions.bind(this);
    }

    /**
     * Add event listener
     */
    componentDidMount() {
        this.updateDimensions();
        window.addEventListener('resize', this.updateDimensions);
    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    getGlobalTransitions() {
        return (
            <Provider
                dataStore={this.props.rootStore.dataStore}
                visStore={this.props.rootStore.visStore}
            >
                <GlobalTransition
                    key="globalTransition"
                    patients={this.props.rootStore.patients}
                    minMax={this.props.rootStore.minMax}
                    heatmapScale={this.props.rootStore.visStore.heatmapScales[0]}
                    {...this.props.tooltipFunctions}
                />
            </Provider>
        );
    }

    getGlobalTimepoints() {
        const timepoints = [];
        this.props.rootStore.dataStore.timepoints.forEach((d, i) => {
            if (d.heatmap.length > 0) {
                timepoints.push(
                    <g key={d.globalIndex}>
                        <TimelineTimepoint
                            timepoint={d}
                            currentVariables={this.props.rootStore.dataStore
                                .variableStores[d.type].fullCurrentVariables}
                            tooltipFunctions={this.props.tooltipFunctions}
                        />
                    </g>,
                );
            }
        });
        return timepoints;
    }

    updateDimensions() {
        this.props.rootStore.visStore
            .setPlotWidth(this.globalTime.current.getBoundingClientRect().width);
        this.props.rootStore.visStore
            .setPlotHeight(window.innerHeight - this.globalTime
                .current.getBoundingClientRect().top);
    }


    render() {
        const transitions = this.getGlobalTransitions();
        const timepoints = this.getGlobalTimepoints();
        return (
            <div ref={this.globalTime} className="scrollableX">
                <svg
                    width={this.props.rootStore.visStore.svgWidth}
                    height={this.props.rootStore.visStore.svgHeight}
                >
                    <g transform={`translate(0,${this.props.rootStore.visStore.timelineRectSize / 2})`}>
                        {transitions}
                        {timepoints}
                    </g>
                </svg>
            </div>
        );
    }
}));
GlobalTimeline.propTypes = {
    tooltipFunctions: PropTypes.objectOf(PropTypes.func).isRequired,
};
export default GlobalTimeline;
