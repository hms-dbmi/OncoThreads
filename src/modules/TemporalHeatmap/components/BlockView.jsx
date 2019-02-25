import React from 'react';
import {observer} from 'mobx-react';
import HeatmapGroupTransition from "./Transitions/HeatmapGroupTransition/HeatmapGroupTransition";
import LineTransition from "./Transitions/LineTransition/LineTransition";
import SankeyTransition from "./Transitions/SankeyTransition/SankeyTransition";
import HeatmapTimepoint from "./Timepoints/Heatmap/HeatmapTimepoint";
import GroupTimepoint from "./Timepoints/Group/GroupTimepoint";


/*
creates the timepoints (either sampleTimepoints or betweenTimepoints)
 */
const BlockView = observer(class BlockView extends React.Component {
    constructor(){
        super();
        this.updateDimensions=this.updateDimensions.bind(this);
    }
    /**
     * Add event listener
     */
    componentDidMount() {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions);
    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions);
    }

    updateDimensions() {
        this.props.visMap.setPlotWidth(this.refs.blockView.parentNode.getBoundingClientRect().width);
        this.props.visMap.setPlotHeight(this.refs.blockView.parentNode.getBoundingClientRect().height);

    }

    render() {
        const _self = this;
        let timepoints = [];
        let transitions = [];
        this.props.store.timepoints.forEach((d, i) => {
            let rectWidth;
            //check the type of the timepoint to get the correct width of the heatmap rectangles
            if (d.type === "between") {
                rectWidth = _self.props.visMap.sampleRectWidth / 2;
            }
            else {
                rectWidth = _self.props.visMap.sampleRectWidth;
            }

            const transform = "translate(0," + _self.props.visMap.timepointPositions.timepoint[i] + ")";
            if (d.heatmap.length > 0) {
                if (d.isGrouped) {
                    timepoints.push(<g key={i + "timepoint"} transform={transform}><GroupTimepoint
                        visMap={_self.props.visMap}
                        store={_self.props.store}
                        group={d.grouped}
                        heatmap={d.heatmap}
                        index={i}
                        currentVariables={_self.props.store.variableStores[d.type].fullCurrentVariables}
                        rectWidth={rectWidth}
                        groupScale={_self.props.groupScale}
                        tooltipFunctions={_self.props.tooltipFunctions}
                        primaryVariableId={d.primaryVariableId}/></g>)
                }
                else {
                    timepoints.push(<g key={i + "timepoint"} transform={transform}>
                        <HeatmapTimepoint
                            visMap={_self.props.visMap}
                            store={_self.props.store}
                            variableStore={_self.props.store.variableStores[d.type]}
                            tooltipFunctions={_self.props.tooltipFunctions}
                            showContextMenuHeatmapRow={_self.props.showContextMenuHeatmapRow}
                            xOffset={(_self.props.visMap.sampleRectWidth - rectWidth) / 2}
                            rectWidth={rectWidth}
                            heatmap={d.heatmap}
                            index={i}
                            currentVariables={_self.props.store.variableStores[d.type].fullCurrentVariables}
                            heatmapScale={_self.props.heatmapScales[i]}
                            primaryVariableId={d.primaryVariableId}
                        /></g>)

                }
            }

            if (i !== this.props.store.timepoints.length - 1) {
                const transform = "translate(0," + _self.props.visMap.timepointPositions.connection[i] + ")";
                const firstTP = d;
                const secondTP = this.props.store.timepoints[i + 1];
                let transition;
                if (firstTP.isGrouped) {
                    if (secondTP.isGrouped) {
                        transition = <SankeyTransition firstGrouped={firstTP.grouped}
                                                       secondGrouped={secondTP.grouped}
                                                       groupScale={this.props.groupScale}
                                                       firstPrimary={this.props.store.variableStores[firstTP.type].getById(firstTP.primaryVariableId)}
                                                       secondPrimary={this.props.store.variableStores[secondTP.type].getById(secondTP.primaryVariableId)}
                                                       tooltipFunctions={this.props.tooltipFunctions}
                                                       visMap={this.props.visMap}
                                                       store={this.props.store}/>
                    }
                    else {
                        transition = <HeatmapGroupTransition inverse={false}
                                                             partitions={firstTP.grouped}
                                                             nonGrouped={secondTP}
                                                             heatmapScale={this.props.heatmapScales[i + 1]}
                                                             groupScale={this.props.groupScale}
                                                             colorScale={this.props.store.variableStores[firstTP.type].getById(firstTP.primaryVariableId).colorScale}
                                                             visMap={this.props.visMap}
                                                             store={this.props.store}/>
                    }
                }
                else {
                    if (secondTP.isGrouped) {
                        transition = <HeatmapGroupTransition inverse={true}
                                                             partitions={secondTP.grouped}
                                                             nonGrouped={firstTP}
                                                             heatmapScale={this.props.heatmapScales[i]}
                                                             groupScale={this.props.groupScale}
                                                             colorScale={this.props.store.variableStores[secondTP.type].getById(secondTP.primaryVariableId).colorScale}
                                                             visMap={this.props.visMap}
                                                             store={this.props.store}/>
                    }
                    else {
                        transition = <LineTransition from={firstTP.patients}
                                                     to={secondTP.patients}
                                                     firstHeatmapScale={this.props.heatmapScales[i]}
                                                     secondHeatmapScale={this.props.heatmapScales[i + 1]}
                                                     secondTimepoint={secondTP}
                                                     timeGapMapper={this.props.store.rootStore.staticMappers[this.props.store.rootStore.timeDistanceId]}
                                                     colorScale={this.props.store.variableStores[secondTP.type].getById(secondTP.primaryVariableId).colorScale}
                                                     visMap={this.props.visMap}
                                                     store={this.props.store}/>
                    }
                }
                transitions.push(<g key={firstTP.globalIndex} transform={transform}>{transition}</g>)
            }
        });
        return <div ref="blockView" className="scrollableX">
            <svg width={this.props.visMap.svgWidth} height={this.props.visMap.svgHeight}>
                {timepoints}
                {transitions}
            </svg>
        </div>


    }
});
export default BlockView;