import React from 'react';
import {observer} from 'mobx-react';

const Legend = observer(class Legend extends React.Component {
    static getLegendEntry(value, opacity, rectWidth, textHeight, currX, lineheight, color) {
        let legendEntry = [];
        legendEntry.push(<rect key={"rect" + value} opacity={opacity} width={rectWidth - 5} height={textHeight + 2}
                               x={currX} y={lineheight / 2 - textHeight / 2}
                               fill={color}/>);
        legendEntry.push(<text key={"text" + value} fontSize={textHeight} x={currX + 2}
                               y={lineheight / 2 + textHeight / 2}>{value}</text>);
        return legendEntry;
    }

    static getContinousLegend(opacity, rectWidth, textHeight, lineheight, color) {
        let legendEntries = [];
        const min = color.domain()[0];
        const max = color.domain()[1];
        let value = min;
        let step = (max - min) / 2;
        let currX = 0;
        for (let i = 0; i < 3; i++) {
            legendEntries = legendEntries.concat(this.getLegendEntry(value, opacity, rectWidth, textHeight, currX, lineheight, color(value)));
            value += step;
            currX += rectWidth
        }
        return legendEntries;
    }

    getCategoricalLegend(row, opacity, rectWidth, textHeight, lineheight, color) {
        let currX = 0;
        let currKeys = [];
        let legendEntries = [];
        row.data.forEach(function (f) {
            if (!currKeys.includes(f.value) && f.value !== undefined) {
                currKeys.push(f.value);
                legendEntries = legendEntries.concat(Legend.getLegendEntry(f.value.toString(), opacity, rectWidth, textHeight, currX, lineheight, color(f.value)));
                currX += rectWidth;
            }
        });
        return (legendEntries);
    }

    getLegend(data, primary, rectWidth, textHeight,currentVariables) {
        const _self = this;
        let legend = [];
        let currPos = 0;
        if(data.length!==undefined) {
            data.forEach(function (d, i) {
                let lineheight;
                let opacity = 1;
                if (primary === d.variable) {
                    lineheight = _self.props.visMap.primaryHeight;
                }
                else {
                    lineheight = _self.props.visMap.secondaryHeight;
                    opacity = 0.5
                }
                let color = _self.props.visMap.getColorScale(d.variable, currentVariables[i].type);

                let legendEntries = [];
                if (currentVariables[i].type === "categorical") {
                    legendEntries = _self.getCategoricalLegend(d, opacity, rectWidth, textHeight, lineheight, color);
                }
                else if (currentVariables[i].type === "binary") {
                    legendEntries = _self.getCategoricalLegend(d, opacity, rectWidth, textHeight, lineheight, color);
                }
                else {
                    legendEntries = Legend.getContinousLegend(opacity, rectWidth, textHeight, lineheight, color);
                }
                const transform = "translate(0," + currPos + ")";
                currPos += lineheight + _self.props.visMap.gap;
                legend.push(<g key={d.variable} transform={transform}>{legendEntries}</g>)
            });
        }
        return legend
    }

    render() {
        const rectWidth = 50;
        const textHeight = 10;
        const _self = this;
        const legends = [];
        this.props.primaryVariables.forEach(function (d, i) {
            let currentVariables=[];
            if(_self.props.store.timepointData[i].type==="between"){
               currentVariables=_self.props.currentBetweenVariables;
            }
            else{
                currentVariables=_self.props.currentSampleVariables;
            }
            let transform = "translate(10," + _self.props.posY[i] + ")";
            legends.push(<g key={i + d}
                            transform={transform}>{_self.getLegend(_self.props.store.timepointData[i].heatmap, d, rectWidth, textHeight,currentVariables)}</g>);

        });
        let transform = "translate(0," + 20 + ")";
        return (
            <svg width={200} height={this.props.height}>
                <g transform={transform}>
                    {legends}
                </g>
            </svg>
        )
    }
});
export default Legend;
