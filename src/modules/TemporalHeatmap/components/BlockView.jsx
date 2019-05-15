import React from 'react';
import {inject, observer, Provider} from 'mobx-react';
import HeatmapGroupTransition from "./Transitions/HeatmapGroupTransition/HeatmapGroupTransition";
import LineTransition from "./Transitions/LineTransition/LineTransition";
import SankeyTransition from "./Transitions/SankeyTransition/SankeyTransition";
import HeatmapTimepoint from "./Timepoints/Heatmap/HeatmapTimepoint";
import GroupTimepoint from "./Timepoints/Group/GroupTimepoint";


/**
 * Component for the Block view
 */
const BlockView = inject("rootStore")(observer(class BlockView extends React.Component {
    render() {
        let timepoints = [];
        let transitions = [];
        this.props.rootStore.dataStore.timepoints.forEach((d, i) => {
            let rectWidth;
            //check the type of the timepoint to get the correct width of the heatmap rectangles
            if (d.type === "between") {
                rectWidth = this.props.rootStore.visStore.sampleRectWidth / 2;
            }
            else {
                rectWidth = this.props.rootStore.visStore.sampleRectWidth;
            }
            // create timepoints
            const transform = "translate(0," + this.props.rootStore.visStore.timepointPositions.timepoint[i] + ")";
            if (d.heatmap.length > 0) {
                if (d.isGrouped) {
                    timepoints.push(<g key={i + "timepoint"} transform={transform}>
                        <Provider dataStore={this.props.rootStore.dataStore}
                                  visStore={this.props.rootStore.visStore}>
                            <GroupTimepoint
                                group={d.grouped}
                                heatmap={d.heatmap}
                                index={i}
                                currentVariables={this.props.rootStore.dataStore.variableStores[d.type].fullCurrentVariables}
                                rectWidth={rectWidth}
                                tooltipFunctions={this.props.tooltipFunctions}
                                primaryVariableId={d.primaryVariableId}/>
                        </Provider></g>)
                }
                else {
                    timepoints.push(<g key={i + "timepoint"} transform={transform}>
                        <Provider dataStore={this.props.rootStore.dataStore}
                                  visStore={this.props.rootStore.visStore}>
                            <HeatmapTimepoint
                                tooltipFunctions={this.props.tooltipFunctions}
                                showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                                xOffset={(this.props.rootStore.visStore.sampleRectWidth - rectWidth) / 2}
                                timepoint={d}
                                rectWidth={rectWidth}
                                heatmapScale={this.props.rootStore.visStore.heatmapScales[i]}
                            />
                        </Provider>
                    </g>)

                }
            }
            // create transitions
            if (i !== this.props.rootStore.dataStore.timepoints.length - 1) {
                const transform = "translate(0," + this.props.rootStore.visStore.timepointPositions.connection[i] + ")";
                const firstTP = d;
                const secondTP = this.props.rootStore.dataStore.timepoints[i + 1];
                let transition;
                if (firstTP.isGrouped) {
                    if (secondTP.isGrouped) {
                        transition = <Provider dataStore={this.props.rootStore.dataStore}
                                               visStore={this.props.rootStore.visStore}>
                            <SankeyTransition firstGrouped={firstTP.grouped}
                                              secondGrouped={secondTP.grouped}
                                              firstPrimary={this.props.rootStore.dataStore.variableStores[firstTP.type].getById(firstTP.primaryVariableId)}
                                              secondPrimary={this.props.rootStore.dataStore.variableStores[secondTP.type].getById(secondTP.primaryVariableId)}
                                              tooltipFunctions={this.props.tooltipFunctions}/>
                        </Provider>
                    }
                    else {
                        transition = <Provider dataStore={this.props.rootStore.dataStore}
                                               visStore={this.props.rootStore.visStore}>
                            <HeatmapGroupTransition
                                inverse={false}
                                partitions={firstTP.grouped}
                                nonGrouped={secondTP}
                                heatmapScale={this.props.rootStore.visStore.heatmapScales[i + 1]}
                                colorScale={this.props.rootStore.dataStore.variableStores[firstTP.type].getById(firstTP.primaryVariableId).colorScale}/>
                        </Provider>
                    }
                }
                else {
                    if (secondTP.isGrouped) {
                        transition = <Provider dataStore={this.props.rootStore.dataStore}
                                               visStore={this.props.rootStore.visStore}>
                            <HeatmapGroupTransition
                                inverse={true}
                                partitions={secondTP.grouped}
                                nonGrouped={firstTP}
                                heatmapScale={this.props.rootStore.visStore.heatmapScales[i]}
                                colorScale={this.props.rootStore.dataStore.variableStores[secondTP.type].getById(secondTP.primaryVariableId).colorScale}/>
                        </Provider>
                    }
                    else {
                        transition = <Provider dataStore={this.props.rootStore.dataStore}
                                               visStore={this.props.rootStore.visStore}>
                            <LineTransition
                                from={firstTP.patients}
                                to={secondTP.patients}
                                firstHeatmapScale={this.props.rootStore.visStore.heatmapScales[i]}
                                secondHeatmapScale={this.props.rootStore.visStore.heatmapScales[i + 1]}
                                secondTimepoint={secondTP}
                                timeGapMapper={this.props.rootStore.staticMappers[this.props.rootStore.timeDistanceId]}
                                colorScale={this.props.rootStore.dataStore.variableStores[secondTP.type].getById(secondTP.primaryVariableId).colorScale}/>
                        </Provider>
                    }
                }
                transitions.push(<g key={firstTP.globalIndex} transform={transform}>{transition}</g>)
            }
        });
        return <div ref="blockView" className="scrollableX">
            <svg width={this.props.rootStore.visStore.svgWidth} height={this.props.rootStore.visStore.svgHeight}>
                {timepoints}
                {transitions}
            </svg>
        </div>


    }
}));
export default BlockView;