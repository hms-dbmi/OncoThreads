import React from 'react';
import {observer} from 'mobx-react';
import RowOperators from "./RowOperators/RowOperators"
import Legend from "./Legend"
import Plot from "./Plot";

const MainView = observer(class MainView extends React.Component {
    getMaxPartitions() {
        let max = 0;
        const _self = this;
        this.props.groupOrder.forEach(function (d, i) {
            if (d.isGrouped) {
                if (_self.props.store.timepointData[i].group.data.length > max) {
                    max = _self.props.store.timepointData[i].group.data.length;
                }
            }
        });
        return max;
    }

    render() {
        this.props.visMap.setGap(1);
        this.props.visMap.setPartitionGap(10);
        this.props.visMap.setTransitionSpace(70);
        let rectWidth = this.props.width / 50 - 1;
        if (this.props.store.numberOfPatients < 50) {
            rectWidth = this.props.width / this.props.store.numberOfPatients - 1;
        }
        this.props.visMap.setSampleRectWidth(rectWidth);
        this.props.visMap.setBetweenRectWidth(rectWidth/2);
        this.props.visMap.setPrimaryHeight(rectWidth);
        this.props.visMap.setSecondaryHeight(rectWidth/2);

        let heatmapWidth = this.props.store.numberOfPatients * (rectWidth + 1);
        const sampleTPHeight = this.props.visMap.getTimepointHeight(this.props.currentSampleVariables.length);
        const betweenTPHeight = this.props.visMap.getTimepointHeight(this.props.currentBetweenVariables.length);
        let timepointY = [];
        let transY = [];
        let prevY=0;
        for (let i = 0; i < this.props.store.timepointData.length; i++) {
            let tpHeight;
            if(this.props.store.timepointData[i].type==="between"){
                tpHeight=betweenTPHeight;
            }
            else{
                tpHeight=sampleTPHeight;
            }
            timepointY.push(prevY);
            transY.push(timepointY[i]+tpHeight);
            prevY+=this.props.visMap.transitionSpace+tpHeight;
        }

        const svgWidth = heatmapWidth + (this.getMaxPartitions() - 1) * this.props.visMap.partitionGap + 0.5 * rectWidth;
        const svgHeight = this.props.store.numberOfTransitions*2 * ((sampleTPHeight+betweenTPHeight)/2 + this.props.visMap.transitionSpace);
        console.log(this.props.transitionStore.transitionData);
        return (
            <div className="heatmapContainer">
                <div className="rowOperators">
                    <svg width={200} height={svgHeight}>
                        <RowOperators primaryVariables={this.props.primaryVariables}
                                      groupOrder={this.props.groupOrder}
                                      currentSampleVariables={this.props.currentSampleVariables}
                                      currentBetweenVariables={this.props.currentBetweenVariables}
                                      store={this.props.store} height={svgHeight}
                                      svgHeight={svgHeight} svgWidth={200}
                                      visMap={this.props.visMap}
                                      posY={timepointY}/>
                    </svg>

                </div>
                <div className="view">
                    <Plot {...this.props} width={svgWidth} height={svgHeight} heatmapWidth={heatmapWidth}
                          timepointY={timepointY}
                          transY={transY}/>
                </div>
                <div className="legend">
                    <Legend {...this.props} height={svgHeight}
                            posY={timepointY}/>
                </div>
            </div>
        )
    }
});
MainView.defaultProps = {
    width: 700
};
export default MainView;