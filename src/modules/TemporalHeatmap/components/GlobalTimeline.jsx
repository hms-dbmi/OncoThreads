import React from 'react';
import {observer} from 'mobx-react';
import TimelineTimepoint from "./Timepoints/GlobalTimeline/TimelineTimepoint";
import GlobalTransition from "./Transitions/GlobalTransition";


/*
creates the timepoints (either sampleTimepoints or betweenTimepoints)
 */
const GlobalTimeline = observer(class GlobalTimeline extends React.Component {
    constructor() {
        super();
        this.updateDimensions = this.updateDimensions.bind(this);
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
        this.props.visMap.setPlotWidth(this.refs.globalTime.parentNode.getBoundingClientRect().width);
        this.props.visMap.setPlotHeight(this.refs.globalTime.parentNode.getBoundingClientRect().height);
    }

    getGlobalTimepoints() {
        const _self = this;
        let timepoints = [];


        let globalIndex = 0;

        this.props.store.timepoints.forEach(function (d, i) {


            let numEventsForEachPatient = [], count;
            let p = _self.props.store.rootStore.patients;

            p.forEach(function (d1) {
                count = 1;

                numEventsForEachPatient.push(count);

            });


            if (d.heatmap.length > 0) {
                timepoints.push(<g key={i + "timepoint" + globalIndex}><TimelineTimepoint
                    timepoint={d.heatmap}
                    timepointType={d.type}
                    primaryVariable={d.primaryVariable}
                    index={i}
                    timeScale={_self.props.timeScale}
                    numEventsForEachPatient={numEventsForEachPatient}
                    currentVariables={_self.props.store.variableStores[d.type].fullCurrentVariables}
                    store={_self.props.store}
                    visMap={_self.props.visMap}
                    heatmapScale={_self.props.heatmapScales[0]}
                    {..._self.props.tooltipFunctions}
                    primaryVariableId={d.primaryVariableId}
                />
                </g>);
                globalIndex++;
            }


        });
        return timepoints;
    }


    getTreatmentTimepoints() {
        const _self = this;
        let timepoints = [];


        let globalIndex = 0;

        //var timepoint_sample, heatmapScale_sample, ind_sample;

        this.props.store.timepoints.forEach(function (d, i) {
            let count;

            let transform;

            let numEventsForEachPatient = [];

            //var sampleEventLengthForThisTimeLine=[];

            let p = _self.props.store.rootStore.patients;


            let transFlag = false;

            //if(_self.props.store.timepoints[i].primaryVariable.datatype!=="NUMBER"){
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.store.timepoints[i].type === "between") {

                transFlag = true;
                //  return timepoints;
                //}


                //ht = k.map(d => (d.eventEndDate - d.eventDate) * 700 / max + _self.props.visMap.primaryHeight);

                transform = "translate(0, 0)";


                //arr;
            }


            else {
                transFlag = false;
                //transform= "translate(0, 350)";
                transform = "translate(0, 0)";


                //p=_self.props.store.rootStore.patients;
                p.forEach(function (d1, j) {
                    count = 1;

                    numEventsForEachPatient.push(count);

                    //count=0;

                });

                //timepoint_sample=d;
                //ind_sample=i;
                //heatmapScale_sample=_self.props.heatmapScales[i];
            }

            //var yp=_self.props.allYPositions[i].map(y => y*700.0/max); //.map(x=>x.timeGapBetweenSample);


            if (d.heatmap.length > 0) {

                let heatmapd = d;
                let heatmapi = i;

                if (!transFlag) {
                    timepoints.push(<g key={heatmapi + "timepoint" + globalIndex} transform={transform}>
                        <TimelineTimepoint
                            timepoint={d.heatmap}
                            timepointType={d.type}
                            primaryVariable={d.primaryVariable} index={heatmapi}
                            timeScale={_self.props.timeScale}
                            numEventsForEachPatient={numEventsForEachPatient}
                            currentVariables={_self.props.store.variableStores[heatmapd.type].fullCurrentVariables}
                            store={_self.props.store}
                            visMap={_self.props.visMap}
                            heatmapScale={_self.props.heatmapScales[0]}
                            {..._self.props.tooltipFunctions}/>
                    </g>);
                }
                else {
                    timepoints.unshift(<g key={heatmapi + "timepoint" + globalIndex} transform={transform}>
                        <TimelineTimepoint
                            timepoint={d.heatmap}
                            timepointType={d.type}
                            primaryVariable={d.primaryVariable} index={heatmapi}
                            timeScale={_self.props.timeScale}
                            numEventsForEachPatient={numEventsForEachPatient}
                            currentVariables={_self.props.store.variableStores[heatmapd.type].fullCurrentVariables}
                            width={_self.props.heatmapWidth}
                            store={_self.props.store}
                            visMap={_self.props.visMap}
                            heatmapScale={_self.props.heatmapScales[0]}
                            {..._self.props.tooltipFunctions}/>
                    </g>);
                }


                globalIndex++;
            }
        });
        return timepoints;
    }

    getGlobalTransitions() {
        return (<GlobalTransition key={"globalTransition"}
                                  patients={this.props.store.rootStore.patients}
                                  minMax={this.props.store.rootStore.minMax}
                                  store={this.props.store} visMap={this.props.visMap}
                                  heatmapScale={this.props.heatmapScales[0]}
                                  timeScale={this.props.timeScale}
                                  {...this.props.tooltipFunctions}/>)
    }


    render() {
        let timepoints = [];
        let transitions = this.getGlobalTransitions();

        if (this.props.store.transitionOn) {
            timepoints = this.getTreatmentTimepoints()
        }
        else {
            timepoints = this.getGlobalTimepoints()

        }
        return <div ref="globalTime" className="scrollableX">
            <svg width={this.props.visMap.svgWidth} height={this.props.visMap.svgHeight}>
                <g transform={"translate(0," + this.props.visMap.timelineRectSize / 2 + ")"}>
                    {transitions}
                    {timepoints}
                </g>
            </svg>
        </div>
    }
});
export default GlobalTimeline;