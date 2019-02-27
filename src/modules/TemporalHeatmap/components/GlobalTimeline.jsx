import React from 'react';
import {inject, observer, Provider} from 'mobx-react';
import TimelineTimepoint from "./Timepoints/GlobalTimeline/TimelineTimepoint";
import GlobalTransition from "./Transitions/GlobalTransition";


/*
creates the timepoints (either sampleTimepoints or betweenTimepoints)
 */
const GlobalTimeline = inject("rootStore")(observer(class GlobalTimeline extends React.Component {
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
        this.props.rootStore.visStore.setPlotWidth(this.refs.globalTime.parentNode.getBoundingClientRect().width);
        this.props.rootStore.visStore.setPlotHeight(this.refs.globalTime.parentNode.getBoundingClientRect().height);
    }

    getGlobalTimepoints() {
        const _self = this;
        let timepoints = [];


        let globalIndex = 0;

        this.props.rootStore.dataStore.timepoints.forEach(function (d, i) {


            let numEventsForEachPatient = [], count;
            let p = _self.props.rootStore.patients;

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
                    currentVariables={_self.props.rootStore.dataStore.variableStores[d.type].fullCurrentVariables}
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

        this.props.rootStore.dataStore.timepoints.forEach(function (d, i) {
            let count;

            let transform;

            let numEventsForEachPatient = [];

            //var sampleEventLengthForThisTimeLine=[];

            let p = _self.props.rootStore.patients;


            let transFlag = false;

            //if(_self.props.rootStore.dataStore.timepoints[i].primaryVariable.datatype!=="NUMBER"){
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.rootStore.dataStore.timepoints[i].type === "between") {

                transFlag = true;
                //  return timepoints;
                //}


                //ht = k.map(d => (d.eventEndDate - d.eventDate) * 700 / max + _self.props.rootStore.visStore.primaryHeight);

                transform = "translate(0, 0)";


                //arr;
            }


            else {
                transFlag = false;
                //transform= "translate(0, 350)";
                transform = "translate(0, 0)";


                //p=_self.props.rootStore.patients;
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
                            currentVariables={_self.props.rootStore.dataStore.variableStores[heatmapd.type].fullCurrentVariables}
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
                            currentVariables={_self.props.rootStore.dataStore.variableStores[heatmapd.type].fullCurrentVariables}
                            width={_self.props.heatmapWidth}
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
        return (<Provider dataStore={this.props.rootStore.dataStore} visStore={this.props.rootStore.visStore}>
            <GlobalTransition key={"globalTransition"}
                              patients={this.props.rootStore.patients}
                              minMax={this.props.rootStore.minMax}
                              heatmapScale={this.props.heatmapScales[0]}
                              timeScale={this.props.timeScale}
                              {...this.props.tooltipFunctions}/></Provider>)
    }


    render() {
        let timepoints = [];
        let transitions = this.getGlobalTransitions();

        if (this.props.rootStore.dataStore.transitionOn) {
            timepoints = this.getTreatmentTimepoints()
        }
        else {
            timepoints = this.getGlobalTimepoints()

        }
        return <div ref="globalTime" className="scrollableX">
            <svg width={this.props.rootStore.visStore.svgWidth} height={this.props.rootStore.visStore.svgHeight}>
                <g transform={"translate(0," + this.props.rootStore.visStore.timelineRectSize / 2 + ")"}>
                    {transitions}
                    {timepoints}
                </g>
            </svg>
        </div>
    }
}));
export default GlobalTimeline;