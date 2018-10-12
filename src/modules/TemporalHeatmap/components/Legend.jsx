import React from 'react';
import {observer} from 'mobx-react';
import uuidv4 from 'uuid/v4';

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
     * @param tooltipText
     * @returns [] legendEntry
     */
    getLegendEntry(value, opacity, rectWidth, fontSize, currX, lineheight, rectColor, textColor, tooltipText) {
        return <g key={value} onMouseEnter={(e) => {
            this.props.showTooltip(e, tooltipText);
        }} onMouseLeave={this.props.hideTooltip}>
            <rect opacity={opacity} width={rectWidth} height={fontSize + 2}
                  x={currX} y={lineheight / 2 - fontSize / 2}
                  fill={rectColor}
            />
            <text fill={textColor} style={{fontSize: fontSize}} x={currX + 2}
                  y={lineheight / 2 + fontSize / 2}>{value}</text>
        </g>;
    }

    /**
     * computes the width of a text. Returns 30 if the text width would be shorter than 30
     * @param min
     * @param text
     * @param fontSize
     * @returns {number}
     */
    static getTextWidth(min, text, fontSize) {
        const context = document.createElement("canvas").getContext("2d");
        context.font = fontSize + "px Arial";
        const width = context.measureText(text).width;
        if (width > min) {
            return width;
        }
        else return min;
    }

    /**
     * gets a legend for a continuous variable
     * @param opacity
     * @param fontSize
     * @param lineheight
     * @param color
     * @returns {Array}
     */
    getContinuousLegend(opacity, fontSize, lineheight, color) {
        const min = color.domain()[0];
        const max = color.domain()[color.domain().length - 1];
        let intermediateStop = null;
        let text = [];
        let _self = this;
        if (color.domain().length === 3) {
            intermediateStop = <stop offset="50%" style={{stopColor: color(color.domain()[1])}}/>;
            text.push(<text key={"text" + min} fill="white" style={{fontSize: fontSize}} x={0}
                            y={lineheight / 2 + fontSize / 2}>{Math.round(min * 100) / 100}</text>,
                <text key={"text" + 0} fill="black" style={{fontSize: fontSize}}
                      x={50 - Legend.getTextWidth(0, 0, fontSize) / 2}
                      y={lineheight / 2 + fontSize / 2}>{0}</text>,
                <text key={"text" + max} fill="white" style={{fontSize: fontSize}}
                      x={100 - Legend.getTextWidth(0, Math.round(max * 100) / 100, fontSize)}
                      y={lineheight / 2 + fontSize / 2}>{Math.round(max * 100) / 100}</text>)
        }
        else {
            text.push(<text key={"text" + min} fill="black" style={{fontSize: fontSize}} x={0}
                            y={lineheight / 2 + fontSize / 2}>{Math.round(min * 100) / 100}</text>,
                <text key={"text" + max} fill="white" style={{fontSize: fontSize}}
                      x={100 - Legend.getTextWidth(0, Math.round(max * 100) / 100, fontSize)}
                      y={lineheight / 2 + fontSize / 2}>{Math.round(max * 100) / 100}</text>)
        }
        let randomId = uuidv4();
        return <g>
            <defs>
                <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: color(min)}}/>
                    {intermediateStop}
                    <stop offset="100%" style={{stopColor: color(max)}}/>
                </linearGradient>
            </defs>
            <rect opacity={opacity} x="0" y="0" width={100} height={lineheight} fill={"url(#" + randomId + ")"}/>
            {text}
        </g>;
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
        const _self = this;
        let currX = 0;
        let currKeys = [];
        let legendEntries = [];
        let rdata;
        //change
        if (!this.props.store.globalTime) {
            rdata = row.data;

            rdata.forEach(function (f) {
                if (!currKeys.includes(f.value) && f.value !== undefined) {
                    const rectWidth = Legend.getTextWidth(30, f.value, fontSize) + 4;
                    currKeys.push(f.value);
                    legendEntries = legendEntries.concat(_self.getLegendEntry(f.value.toString(), opacity, rectWidth, fontSize, currX, lineheight, color(f.value), "black", f.value.toString()));
                    currX += (rectWidth + 2);
                }
            });

        }
        else {
            rdata = row;

            rdata.forEach(function (f) {
                if (!currKeys.includes(f) && f !== undefined) {
                    const rectWidth = Legend.getTextWidth(30, f, fontSize) + 4;
                    currKeys.push(f);
                    legendEntries = legendEntries.concat(_self.getLegendEntry(f.toString(), opacity, rectWidth, fontSize, currX, lineheight, color(f), "black", f.value.toString()));
                    currX += (rectWidth + 2);
                }
            });
        }

        return (legendEntries);
    }

    getBinnedLegend(opacity, fontSize, lineheight, color, modification) {
        let legendEntries = [];
        const _self = this;
        let currX = 0;
        color.domain().forEach(function (d, i) {
            let rgb = color.range()[i].replace(/[^\d,]/g, '').split(',');
            let brightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
            let textColor;
            if (brightness < 255 / 2) {
                textColor = "white";
            }
            else {
                textColor = "black";
            }
            const rectWidth = Legend.getTextWidth(30, d, fontSize) + 4;
            const tooltipText=d+ ": " + modification.bins[i] + " to " + modification.bins[i+1];
            legendEntries = legendEntries.concat(_self.getLegendEntry(d, opacity, rectWidth, fontSize, currX, lineheight, color(d), textColor, tooltipText));
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
    getBinaryLegend(row, opacity, fontSize, lineheight, color) {
        let _self = this;
        let legendEntries = [];
        legendEntries = legendEntries.concat(_self.getLegendEntry("true", opacity, Legend.getTextWidth(30, "true", fontSize) + 4, fontSize, 0, lineheight, color(true), "black", "true"));
        legendEntries = legendEntries.concat(_self.getLegendEntry("false", opacity, Legend.getTextWidth(30, "false", fontSize) + 4, fontSize, Legend.getTextWidth(30, "true", fontSize) + 6, lineheight, color(false), "black", "true"));
        return (legendEntries);
    }

    getHighlightRect(height, width) {
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

        if (!this.props.store.globalTime) {
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
                    let color = currentVariables[i].colorScale;
                    let legendEntries = [];
                    if (lineheight < fontSize) {
                        fontSize = Math.round(lineheight);
                    }
                    if (currentVariables[i].datatype === "STRING") {
                        legendEntries = _self.getCategoricalLegend(d, opacity, fontSize, lineheight, color);
                    }
                    else if (currentVariables[i].datatype === "binary") {
                        legendEntries = _self.getBinaryLegend(d, opacity, fontSize, lineheight, color);
                    }
                    else if (currentVariables[i].datatype === "BINNED") {
                        legendEntries = _self.getBinnedLegend(opacity, fontSize, lineheight, color, currentVariables[i].modification);
                    }
                    else {
                        legendEntries = _self.getContinuousLegend(opacity, fontSize, lineheight, color);
                    }
                    const transform = "translate(0," + currPos + ")";
                    currPos += lineheight + _self.props.visMap.gap;
                    let highlightRect = null;
                    if (d.variable === _self.props.highlightedVariable) {
                        highlightRect = _self.getHighlightRect(lineheight, 400)
                    }
                    legend.push(<g key={d.variable} transform={transform}>{highlightRect}{legendEntries}</g>)
                });
            }
        }
        else {
            if (data.length !== undefined) {
                //data.forEach(function (d, i) {
                let lineheight;
                let opacity = 1;
                //change
                if (primary === currentVariables.id) {
                    lineheight = _self.props.visMap.primaryHeight;
                }
                else {
                    lineheight = _self.props.visMap.secondaryHeight;
                    opacity = 0.5
                }

                //change
                let color = currentVariables.colorScale;

                var x = [];
                var i = 0;// dummy

                data.forEach(function (l) {
                    x.push(l.value)
                }); //get the values

                var unique = x.filter(function (item, i, ar) {
                    return ar.indexOf(item) === i;
                }); //get unique values, such as grades II, III, and IV


                let legendEntries = [];
                if (lineheight < fontSize) {
                    fontSize = Math.round(lineheight);
                }
                if (currentVariables.datatype === "STRING") {
                    legendEntries = _self.getCategoricalLegend(unique, opacity, fontSize, lineheight, color);
                }
                else if (currentVariables.datatype === "binary") {

                    legendEntries = _self.getBinaryLegend(unique, opacity, fontSize, lineheight, color);
                }
                else if (currentVariables.datatype === "BINNED") {
                    legendEntries = _self.getBinnedLegend(opacity, fontSize, lineheight, color);
                }
                else {
                    legendEntries = _self.getContinuousLegend(opacity, fontSize, lineheight, color);
                }
                const transform = "translate(0," + currPos + ")";
                currPos += lineheight + _self.props.visMap.gap;
                let highlightRect = null;
                //change
                if (currentVariables.id === _self.props.highlightedVariable) {
                    highlightRect = _self.getHighlightRect(lineheight, 400)
                }
                legend.push(<g key={currentVariables.id} transform={transform}>{highlightRect}{legendEntries}</g>)
                //});
            }

        }
        return legend
    }


    render() {
        const textHeight = 10;
        const _self = this;
        const legends = [];

        let transform = "translate(0," + 20 + ")";
        if (!this.props.store.globalTime) {
            this.props.timepoints.forEach(function (d, i) {
                let transform = "translate(10," + _self.props.posY[i] + ")";

                const lg = _self.getLegend(d.heatmap, d.primaryVariableId, textHeight, _self.props.store.variableStore[d.type].currentVariables);

                legends.push(<g key={i + d}
                                transform={transform}
                >
                    {lg}
                </g>);

            });
        }
        else {
            var dh = [], dp, dt = [];
            var indx = 0;
            this.props.timepoints.forEach(function (d, i) {
                if (d.type === 'sample') {
                    d.heatmap.forEach(function (d1, j) {
                        if (_self.props.currentVariables.sample.filter(l => l.id === d1.variable)[0].originalIds[0] === _self.props.store.rootStore.globalPrimary) {
                            //console.log(i)
                            indx = j;
                        }
                    });
                    dh.push(d.heatmap[indx]);
                    dp = d.primaryVariableId;
                    dt.push(_self.props.store.variableStore[d.type].currentVariables[indx]);
                }
            });
            var dh_combined = dh.reduce((concatenated, nextDh) => concatenated.concat(nextDh.data.slice()), [])//dh[0].data.concat(dh[1].data, dh[2].data, dh[3].data);
            var d = this.props.timepoints[indx];
            let transform = "translate(10," + _self.props.posY[0] + ")";
            var lg = _self.getLegend(dh_combined, dp, textHeight, dt[0]);
            legends.push(<g key={0 + d}
                            transform={transform}>
                {lg}
            </g>);


        }
        //let transform = "translate(-5," + 20 + ")";
        let viewBox = "0, 0, " + this.props.width + ", " + this.props.height;
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
