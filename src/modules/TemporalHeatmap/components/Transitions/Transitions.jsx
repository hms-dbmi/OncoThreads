import React from 'react';
import {observer} from 'mobx-react';
import Transition from './Transition'
/*
creates the transitions between timepoints
 */
const Transitions = observer(class Transitions extends React.Component {


    getTransitions() {
        const _self = this;
        let globalInd = 0;
        return (_self.props.transitionData.map(function (d, i) {
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "transition"} transform={transform}><Transition transition={d}
                                                                                index={i}
                                                                                realTime={_self.props.realTime}
                                                                                firstTimepoint={_self.props.timepoints[i]}
                                                                                secondTimepoint={_self.props.timepoints[i + 1]}
                                                                                firstPrimary={_self.props.timepoints[i].primaryVariable}
                                                                                secondPrimary={_self.props.timepoints[i+1].primaryVariable}
                                                                                groupScale={_self.props.groupScale}
                                                                                firstHeatmapScale={_self.props.heatmapScales[i]}
                                                                                secondHeatmapScale={_self.props.heatmapScales[i + 1]}
                                                                                selectedPatients={_self.props.selectedPatients}
                                                                                showTooltip={_self.props.showTooltip}
                                                                                hideTooltip={_self.props.hideTooltip}
                                                                                visMap={_self.props.visMap}/>
            </g>);

        }))
    }


    getGlobalTransitions() {
        console.log(this.props.allYPositions);
        const _self = this;
        let globalInd = 0;

        let trans_ind = -1;

        let flagSample = false;

        _self.props.timepoints.forEach(function (d) {
            if (d.type === "sample") flagSample = true;
        });

        return (_self.props.transitionData.map(function (d, i) {
            const firstPrimary = _self.getPrimaryWithType(i);
            const secondPrimary = _self.getPrimaryWithType(i + 1);

            if (!_self.props.store.rootStore.transitionOn) {
                globalInd++;
                return (<g key={i + "transition" + globalInd}><Transition transition={d}
                                                                          index={i}
                                                                          realTime={_self.props.realTime}
                                                                          transitionOn={_self.props.transitionOn}
                                                                          globalTime={_self.props.globalTime}
                                                                          firstTimepoint={_self.props.timepoints[i]}
                                                                          secondTimepoint={_self.props.timepoints[i + 1]}
                                                                          firstPrimary={firstPrimary}
                                                                          secondPrimary={secondPrimary}
                                                                          groupScale={_self.props.groupScale}
                                                                          firstHeatmapScale={_self.props.heatmapScales[i]}
                                                                          secondHeatmapScale={_self.props.heatmapScales[i + 1]}
                                                                          allYPositionsy1={_self.props.allYPositions[i]}
                                                                          allYPositionsy2={_self.props.allYPositions[i + 1]}
                                                                          max={_self.props.max}
                                                                          selectedPatients={_self.props.selectedPatients}
                                                                          showTooltip={_self.props.showTooltip}
                                                                          hideTooltip={_self.props.hideTooltip}
                                                                          visMap={_self.props.visMap}/>
                </g>);

            }
            else {
                if (i%2===1) {
                    if (i + 2 < _self.props.transitionData.length) {
                        trans_ind += 1;
                        let firstIndex = i;
                        let secondIndex = i + 2;
                        console.log(firstIndex, secondIndex);
                        return (<g key={i + "transition" + globalInd}><Transition transition={d}
                                                                                  index={i}
                                                                                  realTime={_self.props.realTime}
                                                                                  transitionOn={_self.props.transitionOn}
                                                                                  globalTime={_self.props.globalTime}
                                                                                  firstTimepoint={_self.props.timepoints[firstIndex]}
                                                                                  secondTimepoint={_self.props.timepoints[secondIndex]}
                                                                                  firstPrimary={firstPrimary}
                                                                                  secondPrimary={secondPrimary}
                                                                                  groupScale={_self.props.groupScale}
                                                                                  firstHeatmapScale={_self.props.heatmapScales[firstIndex]}
                                                                                  secondHeatmapScale={_self.props.heatmapScales[secondIndex]}
                                                                                  allYPositionsy1={_self.props.allYPositions[trans_ind]}
                                                                                  allYPositionsy2={_self.props.allYPositions[trans_ind + 1]}
                                                                                  max={_self.props.max}
                                                                                  selectedPatients={_self.props.selectedPatients}
                                                                                  showTooltip={_self.props.showTooltip}
                                                                                  hideTooltip={_self.props.hideTooltip}
                                                                                  visMap={_self.props.visMap}/>
                        </g>);
                    }
                }
                }
                /*
                else {
                    globalInd++;
                    trans_ind++;
                    return (<g key={i + "transition" + globalInd}><Transition transition={d}
                                                                              index={i}
                                                                              realTime={_self.props.realTime}
                                                                              transitionOn={_self.props.transitionOn}
                                                                              globalTime={_self.props.globalTime}
                                                                              firstTimepoint={_self.props.timepoints[i]}
                                                                              secondTimepoint={_self.props.timepoints[i + 1]}
                                                                              firstPrimary={firstPrimary}
                                                                              secondPrimary={secondPrimary}
                                                                              groupScale={_self.props.groupScale}
                                                                              firstHeatmapScale={_self.props.heatmapScales[i]}
                                                                              secondHeatmapScale={_self.props.heatmapScales[i + 1]}
                                                                              allYPositionsy1={_self.props.allYPositions[trans_ind]}
                                                                              allYPositionsy2={_self.props.allYPositions[trans_ind + 1]}
                                                                              max={_self.props.max}
                                                                              selectedPatients={_self.props.selectedPatients}
                                                                              showTooltip={_self.props.showTooltip}
                                                                              hideTooltip={_self.props.hideTooltip}
                                                                              visMap={_self.props.visMap}/>
                    </g>);
                }*/

            return null;
        }))
    }


    render() {

        if (this.props.store.rootStore.globalTime) {
            return (
                this.getGlobalTransitions()
            )
        } else {

            return (
                this.getTransitions()
            )
        }


    }
});
export default Transitions;