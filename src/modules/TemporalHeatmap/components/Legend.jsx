import React from 'react';
import {observer} from 'mobx-react';
/*
implements the legend on the right side of the main view
 */
const Legend = observer(class Legend extends React.Component {
    /**
     * gets a single entry of the legend
     * @param value: text to display
     * @param opacity: 1 if primary, lower for secondary
     * @param rectWidth
     * @param textHeight
     * @param currX: current x position
     * @param lineheight
     * @param rectColor
     * @param textColor
     * @returns [] legendEntry
     */
    static getLegendEntry(value, opacity, rectWidth, textHeight, currX, lineheight, rectColor, textColor) {
        let legendEntry = [];
        legendEntry.push(<rect key={"rect" + value} opacity={opacity} width={rectWidth} height={textHeight + 2}
                               x={currX} y={lineheight / 2 - textHeight / 2}
                               fill={rectColor}/>);
        legendEntry.push(<text key={"text" + value} fill={textColor} fontSize={textHeight} x={currX + 2}
                               y={lineheight / 2 + textHeight / 2}>{value}</text>);
        return legendEntry;
    }

    /**
     * computes the width of a text. Returns 30 if the text width would be shorter than 30
     * @param text
     * @returns {number}
     */
    static getTextWidth(text) {
        const minWidth = 30;
        const context = document.createElement("canvas").getContext("2d");
        const width = context.measureText(text).width;
        if (width > minWidth) {
            return width;
        }
        else return minWidth;
    }

    /**
     * gets a legend for a continous variable
     * @param opacity
     * @param textHeight
     * @param lineheight
     * @param color
     * @returns {Array}
     */
    static getContinuousLegend(opacity, textHeight, lineheight, color) {
        let legendEntries = [];
        const min = color.domain()[0];
        const max = color.domain()[1];
        let value = min;
        let textValue;
        let step = (parseFloat(max) - parseFloat(min)) / 2;
        let currX = 0;
        for (let i = 0; i < 3; i++) {
            if (i < 1) {
                textValue = max;
            }
            else {
                textValue = min
            }
            const rectWidth = Legend.getTextWidth(value) + 4;
            legendEntries = legendEntries.concat(this.getLegendEntry(value, opacity, rectWidth, textHeight, currX, lineheight, color(value), color(textValue)));
            value += step;
            currX += rectWidth + 2
        }
        return legendEntries;
    }

    /**
     * gets a legend for a categorical variable
     * @param row
     * @param opacity
     * @param textHeight
     * @param lineheight
     * @param color
     * @returns {Array}
     */
    getCategoricalLegend(row, opacity, textHeight, lineheight, color) {
        let currX = 0;
        let currKeys = [];
        let legendEntries = [];
        row.data.forEach(function (f) {
            if (!currKeys.includes(f.value) && f.value !== undefined) {
                const rectWidth = Legend.getTextWidth(f.value) + 4;
                currKeys.push(f.value);
                legendEntries = legendEntries.concat(Legend.getLegendEntry(f.value.toString(), opacity, rectWidth, textHeight, currX, lineheight, color(f.value), "black"));
                currX += (rectWidth + 2);
            }
        });
        return (legendEntries);
    }
    static getBinnedLegend(opacity, textHeight, lineheight, color) {
        let legendEntries = [];
        const _self=this;
        let currX = 0;
        color.domain().forEach(function (d,i) {
            let textValue;
            if(i<color.domain().length/2){
                textValue= color.domain()[color.domain().length-1]
            }
            else{
                textValue=color.domain()[0]
            }
                const rectWidth = Legend.getTextWidth(d) + 4;
                legendEntries = legendEntries.concat(_self.getLegendEntry(d, opacity, rectWidth, textHeight, currX, lineheight, color(d), color(textValue)));
                currX += (rectWidth + 2);
        });
        return legendEntries;
    }
    /**
     * gets a legend for a binary variable
     * @param row
     * @param opacity
     * @param textHeight
     * @param lineheight
     * @param color
     * @returns {Array}
     */
    static getBinaryLegend(row, opacity, textHeight, lineheight, color) {
        let legendEntries = [];
        legendEntries = legendEntries.concat(Legend.getLegendEntry("true", opacity, Legend.getTextWidth("true") + 4, textHeight, 0, lineheight, color(true), "black"));
        legendEntries = legendEntries.concat(Legend.getLegendEntry("false", opacity, Legend.getTextWidth("false") + 4, textHeight, Legend.getTextWidth("true") + 6, lineheight, color(false), "black"));
        return (legendEntries);
    }



    /**
     * gets the legend
     * @param data
     * @param primary
     * @param textHeight
     * @param currentVariables
     * @returns {Array}
     */
    getLegend(data, primary, textHeight, currentVariables) {
        const _self = this;
        let legend = [];
        let currPos = 0;
        if (data.length !== undefined) {
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
                if (currentVariables[i].type === "STRING") {
                    legendEntries = _self.getCategoricalLegend(d, opacity, textHeight, lineheight, color);
                }
                else if (currentVariables[i].type === "binary") {
                    legendEntries = Legend.getBinaryLegend(d, opacity, textHeight, lineheight, color);
                }
                else if(currentVariables[i].type === "BINNED"){
                    legendEntries=Legend.getBinnedLegend(opacity,textHeight,lineheight,color);
                }
                else {
                    legendEntries = Legend.getContinuousLegend(opacity, textHeight, lineheight, color);
                }
                const transform = "translate(0," + currPos + ")";
                currPos += lineheight + _self.props.visMap.gap;
                legend.push(<g key={d.variable} transform={transform}>{legendEntries}</g>)
            });
        }
        return legend
    }

    render() {
        const textHeight = 10;
        const _self = this;
        const legends = [];
        this.props.primaryVariables.forEach(function (d, i) {
            let currentVariables = [];
            if (_self.props.store.timepointData[i].type === "between") {
                currentVariables = _self.props.currentBetweenVariables;
            }
            else {
                currentVariables = _self.props.currentSampleVariables;
            }
            let transform = "translate(10," + _self.props.posY[i] + ")";
            legends.push(<g key={i + d}
                            transform={transform}>{_self.getLegend(_self.props.store.timepointData[i].heatmap, d, textHeight, currentVariables)}</g>);

        });
        let transform = "translate(0," + 20 + ")";
        return (
            <div className="legend">
                <svg width={200} height={this.props.height}>
                    <g transform={transform}>
                        {legends}
                    </g>
                </svg>
            </div>
        )
    }
});
export default Legend;
