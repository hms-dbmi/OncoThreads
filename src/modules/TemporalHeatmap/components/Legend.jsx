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
     * @param fontSize
     * @param currX: current x position
     * @param lineheight
     * @param rectColor
     * @param textColor
     * @returns [] legendEntry
     */
    static getLegendEntry(value, opacity, rectWidth, fontSize, currX, lineheight, rectColor, textColor) {
        let legendEntry = [];
        legendEntry.push(<rect key={"rect" + value} opacity={opacity} width={rectWidth} height={fontSize + 2}
                               x={currX} y={lineheight / 2 - fontSize / 2}
                               fill={rectColor}/>);
        legendEntry.push(<text key={"text" + value} fill={textColor} style={{fontSize:fontSize}} x={currX + 2}
                               y={lineheight/2+fontSize/2}>{value}</text>);
        return legendEntry;
    }

    /**
     * computes the width of a text. Returns 30 if the text width would be shorter than 30
     * @param text
     * @param fontSize
     * @returns {number}
     */
    static getTextWidth(text,fontSize) {
        const minWidth = 30;
        const context = document.createElement("canvas").getContext("2d");
        context.font=fontSize+"px Arial";
        const width = context.measureText(text).width;
        if (width > minWidth) {
            return width;
        }
        else return minWidth;
    }

    /**
     * gets a legend for a continuous variable
     * @param opacity
     * @param fontSize
     * @param lineheight
     * @param color
     * @returns {Array}
     */
    static getContinuousLegend(opacity, fontSize, lineheight, color) {
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
            const rectWidth = Legend.getTextWidth(value,fontSize) + 4;
            legendEntries = legendEntries.concat(this.getLegendEntry(value, opacity, rectWidth, fontSize, currX, lineheight, color(value), color(textValue)));
            value += step;
            currX += rectWidth + 2
        }
        return legendEntries;
    }

    /**
     * gets a legend for a categorical variable
     * @param row
     * @param opacity
     * @param fontSize
     * @param lineheight
     * @param color
     * @returns {Array}
     */
    getCategoricalLegend(row, opacity, fontSize, lineheight, color) {
        let currX = 0;
        let currKeys = [];
        let legendEntries = [];
        row.data.forEach(function (f) {
            if (!currKeys.includes(f.value) && f.value !== undefined) {
                const rectWidth = Legend.getTextWidth(f.value,fontSize) + 4;
                currKeys.push(f.value);
                legendEntries = legendEntries.concat(Legend.getLegendEntry(f.value.toString(), opacity, rectWidth, fontSize, currX, lineheight, color(f.value), "black"));
                currX += (rectWidth + 2);
            }
        });
        return (legendEntries);
    }
    static getBinnedLegend(opacity, fontSize, lineheight, color) {
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
                const rectWidth = Legend.getTextWidth(d,fontSize) + 4;
                legendEntries = legendEntries.concat(_self.getLegendEntry(d, opacity, rectWidth, fontSize, currX, lineheight, color(d), color(textValue)));
                currX += (rectWidth + 2);
        });
        return legendEntries;
    }
    /**
     * gets a legend for a binary variable
     * @param row
     * @param opacity
     * @param fontSize
     * @param lineheight
     * @param color
     * @returns {Array}
     */
    static getBinaryLegend(row, opacity, fontSize, lineheight, color) {
        let legendEntries = [];
        legendEntries = legendEntries.concat(Legend.getLegendEntry("true", opacity, Legend.getTextWidth("true",fontSize) + 4, fontSize, 0, lineheight, color(true), "black"));
        legendEntries = legendEntries.concat(Legend.getLegendEntry("false", opacity, Legend.getTextWidth("false",fontSize) + 4, fontSize, Legend.getTextWidth("true") + 6, lineheight, color(false), "black"));
        return (legendEntries);
    }

      getHighlightRect(height,width){
            return <rect height={height} width={width} fill="lightgray"/>
        }

    /**
     * gets the legend
     * @param data
     * @param primary
     * @param fontSize
     * @param currentVariables
     * @returns {Array}
     */
    getLegend(data, primary, fontSize, currentVariables) {
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
                let color = _self.props.visMap.getColorScale(d.variable, currentVariables[i].datatype);
                let legendEntries = [];
                if(lineheight<fontSize){
                    fontSize=Math.round(lineheight);
                }
                if (currentVariables[i].datatype === "STRING") {
                    legendEntries = _self.getCategoricalLegend(d, opacity, fontSize, lineheight, color);
                }
                else if (currentVariables[i].datatype === "binary") {
                    legendEntries = Legend.getBinaryLegend(d, opacity, fontSize, lineheight, color);
                }
                else if(currentVariables[i].datatype === "BINNED"){
                    legendEntries=Legend.getBinnedLegend(opacity,fontSize,lineheight,color);
                }
                else {
                    legendEntries = Legend.getContinuousLegend(opacity, fontSize, lineheight, color);
                }
                const transform = "translate(0," + currPos + ")";
                currPos += lineheight + _self.props.visMap.gap;
                let highlightRect=null;
                if(d.variable===_self.props.highlightedVariable){
                    highlightRect=_self.getHighlightRect(lineheight,400)
                }
                legend.push(<g key={d.variable} transform={transform}>{highlightRect}{legendEntries}</g>)
            });
        }
        return legend
    }

    render() {
        const textHeight = 10;
        const _self = this;
        const legends = [];
        this.props.timepoints.forEach(function (d, i) {
            let transform = "translate(10," + _self.props.posY[i] + ")";
            legends.push(<g key={i + d}
                            transform={transform}>{_self.getLegend(d.heatmap, d.primaryVariableId, textHeight, _self.props.store.variableStore[d.type].currentVariables)}</g>);

        });
        let transform = "translate(0," + 20 + ")";
        let viewBox="0, 0, "+this.props.width+", "+this.props.height;
        return (
            <div className="scrollableX">
                <svg width={this.props.width} height={this.props.height} viewBox={viewBox}>
                    <g transform={transform}>
                        {legends}
                    </g>
                </svg>
            </div>
        )
    }
});
export default Legend;
