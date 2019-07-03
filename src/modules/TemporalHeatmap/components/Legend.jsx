import React from 'react';
import { observer, inject } from 'mobx-react';
import uuidv4 from 'uuid/v4';
import UtilityFunctions from '../UtilityClasses/UtilityFunctions';
import ColorScales from '../UtilityClasses/ColorScales';

/**
 * Legend Component
 */
const Legend = inject('rootStore', 'uiStore')(observer(class Legend extends React.Component {
    constructor() {
        super();
        this.maxWidth = 0;
        this.borderLeft = 10;
    }

    /**
     * gets a single entry of the legend
     * @param {string} value - text to display
     * @param {number} opacity - 1 if primary, lower for secondary
     * @param {number} rectWidth
     * @param {number} fontSize
     * @param {number} currX - current x position
     * @param {number} lineheight
     * @param {string} rectColor
     * @param {string} textColor
     * @param {string} tooltipText
     * @returns {g} legendEntry
     */
    getLegendEntry(value, opacity, rectWidth, fontSize, currX,
        lineheight, rectColor, textColor, tooltipText) {
        return (
            <g
                key={value}
                onMouseEnter={(e) => {
                    this.props.showTooltip(e, tooltipText);
                }}
                onMouseLeave={this.props.hideTooltip}
            >
                <rect
                    opacity={opacity}
                    width={rectWidth}
                    height={fontSize + 2}
                    x={currX}
                    y={lineheight / 2 - fontSize / 2}
                    fill={rectColor}
                />
                <text
                    fill={textColor}
                    style={{ fontSize }}
                    x={currX + 2}
                    y={lineheight / 2 + fontSize / 2}
                >
                    {value}
                </text>
            </g>
        );
    }

    /**
     * computes the width of a text. Returns 30 if the text width would be shorter than 30
     * @param {number} min
     * @param {string} text
     * @param {number} fontSize
     * @returns {number}
     */
    static getTextWidth(min, text, fontSize) {
        const width = UtilityFunctions.getTextWidth(text, fontSize);
        if (width > min) {
            return width;
        }
        return min;
    }

    /**
     * gets a legend for a continuous variable
     * @param {number} opacity
     * @param {number} fontSize
     * @param {number} lineheight
     * @param {function} color
     * @returns {(g|null)}
     */
    getContinuousLegend(opacity, fontSize, lineheight, color) {
        const min = color.domain()[0];
        const max = color.domain()[color.domain().length - 1];
        if (min !== Number.NEGATIVE_INFINITY && max !== Number.POSITIVE_INFINITY) {
            let intermediateStop = null;
            const text = [];
            if (color.domain().length === 3) {
                intermediateStop = <stop offset="50%" style={{ stopColor: color(color.domain()[1]) }} />;
                text.push(
                    <text
                        key="text min"
                        fill={ColorScales.getHighContrastColor(color(min))}
                        style={{ fontSize }}
                        x={0}
                        y={lineheight / 2 + fontSize / 2}
                    >
                        {UtilityFunctions.getScientificNotation(min)}
                    </text>,
                    <text
                        key="text med"
                        fill={ColorScales.getHighContrastColor(color(0))}
                        style={{ fontSize }}
                        x={50 - Legend.getTextWidth(0, 0, fontSize) / 2}
                        y={lineheight / 2 + fontSize / 2}
                    >
                        {0}
                    </text>,
                    <text
                        key="text max"
                        fill={ColorScales.getHighContrastColor(color(max))}
                        style={{ fontSize }}
                        x={100 - Legend.getTextWidth(0,
                            UtilityFunctions.getScientificNotation(max), fontSize)}
                        y={lineheight / 2 + fontSize / 2}
                    >
                        {UtilityFunctions.getScientificNotation(max)}
                    </text>,
                );
            } else {
                text.push(
                    <text
                        key="text min"
                        fill={ColorScales.getHighContrastColor(color(min))}
                        style={{ fontSize }}
                        x={0}
                        y={lineheight / 2 + fontSize / 2}
                    >
                        {UtilityFunctions.getScientificNotation(min)}
                    </text>,
                    <text
                        key="text max"
                        fill={ColorScales.getHighContrastColor(color(max))}
                        style={{ fontSize }}
                        x={100 - Legend.getTextWidth(0,
                            UtilityFunctions.getScientificNotation(max), fontSize)}
                        y={lineheight / 2 + fontSize / 2}
                    >
                        {UtilityFunctions.getScientificNotation(max)}
                    </text>,
                );
            }
            const randomId = uuidv4();
            this.updateMaxWidth(100 + this.borderLeft);
            return (
                <g transform={`translate(${this.borderLeft},0)`}>
                    <defs>
                        <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: color(min) }} />
                            {intermediateStop}
                            <stop offset="100%" style={{ stopColor: color(max) }} />
                        </linearGradient>
                    </defs>
                    <rect opacity={opacity} x="0" y="0" width={100} height={lineheight} fill={`url(#${randomId})`} />
                    {text}
                </g>
            );
        }

        return null;
    }

    /**
     * gets a legend for a categorical variable
     * @param {(DerivedVariable|OriginalVariable)} variable
     * @param {Object[]} row
     * @param {number} opacity
     * @param {number} fontSize
     * @param {number} lineheight
     * @returns {g[]}
     */
    getCategoricalLegend(variable, row, opacity, fontSize, lineheight) {
        let currX = this.borderLeft;
        const legendEntries = [];
        variable.domain.forEach((d, i) => {
            if (variable.datatype === 'ORDINAL' || row.includes(d)) {
                let tooltipText;
                if (variable.derived && variable.datatype === 'ORDINAL' && variable.modification.type === 'continuousTransform' && variable.modification.binning.binNames[i].modified) {
                    tooltipText = `${d}: ${UtilityFunctions.getScientificNotation(variable.modification.binning.bins[i])} to ${UtilityFunctions.getScientificNotation(variable.modification.binning.bins[i + 1])}`;
                } else {
                    tooltipText = d;
                }
                const rectWidth = Legend.getTextWidth(30, d, fontSize) + 4;
                if (d !== undefined) {
                    legendEntries.push(this.getLegendEntry(d, opacity, rectWidth,
                        fontSize, currX, lineheight, variable.colorScale(d),
                        ColorScales.getHighContrastColor(variable.colorScale(d)), tooltipText));
                    currX += (rectWidth + 2);
                }
            }
        });
        this.updateMaxWidth(currX);
        return legendEntries;
    }

    /**
     * gets a legend for a binary variable
     * @param {number} opacity
     * @param {number} fontSize
     * @param {number} lineheight
     * @param {string} color
     * @returns {Array}
     */
    getBinaryLegend(opacity, fontSize, lineheight, color) {
        let legendEntries = [];
        legendEntries = legendEntries.concat(this.getLegendEntry('true', opacity, Legend.getTextWidth(30, 'true', fontSize) + 4, fontSize, this.borderLeft, lineheight, color(true), 'black', 'true'));
        legendEntries = legendEntries.concat(this.getLegendEntry('false', opacity, Legend.getTextWidth(30, 'false', fontSize) + 4, fontSize, this.borderLeft + Legend.getTextWidth(30, 'true', fontSize) + 6, lineheight, color(false), 'black', 'true'));
        this.updateMaxWidth(74);
        return (legendEntries);
    }

    /**
     * creates a grey rectangle in order to highlight a row
     * @param {number} height
     * @returns {*}
     */
    getHighlightRect(height) {
        return <rect height={height} width={this.maxWidth} fill="lightgray" />;
    }

    /**
     * gets the legend
     * @param {Object[]} data
     * @param {string} primary
     * @param {number} fontSize
     * @param {(DerivedVariable|OriginalVariable)[]} currentVariables
     * @returns {g[]}
     */
    getBlockLegend(data, primary, fontSize, currentVariables) {
        const legend = [];
        let currPos = 0;
        currentVariables.forEach((d, i) => {
            if (!data[i].isUndef || this.props.uiStore.showUndefined || primary === d.id) {
                let lineheight;
                let adaptedFontSize = fontSize;
                let opacity = 1;
                if (primary === d.id) {
                    lineheight = this.props.rootStore.visStore.primaryHeight;
                } else {
                    lineheight = this.props.rootStore.visStore.secondaryHeight;
                    opacity = 0.5;
                }
                const color = d.colorScale;
                let legendEntries = [];
                if (lineheight < adaptedFontSize) {
                    adaptedFontSize = Math.round(lineheight);
                }
                if (d.datatype === 'STRING' || d.datatype === 'ORDINAL') {
                    legendEntries = this.getCategoricalLegend(d, data[i].data
                        .map(element => element.value), opacity, adaptedFontSize, lineheight);
                } else if (d.datatype === 'BINARY') {
                    legendEntries = this.getBinaryLegend(opacity, adaptedFontSize,
                        lineheight, color);
                } else {
                    legendEntries = this.getContinuousLegend(opacity, adaptedFontSize,
                        lineheight, color);
                }
                const transform = `translate(0,${currPos})`;
                currPos += lineheight + this.props.rootStore.visStore.gap;
                let highlightRect = null;
                if (d.id === this.props.highlightedVariable) {
                    highlightRect = this.getHighlightRect(lineheight);
                }
                legend.push(
                    <g key={d.id} transform={transform}>
                        {highlightRect}
                        {legendEntries}
                    </g>,
                );
            }
        });
        return legend;
    }

    /**
     * gets global legend
     * @param {number} fontSize
     * @param {(DerivedVariable|OriginalVariable)} primaryVariable
     * @returns {g[]}
     */
    getGlobalLegend(fontSize, primaryVariable) {
        let legend;
        if (primaryVariable.datatype === 'STRING' || primaryVariable.datatype === 'ORDINAL') {
            let allValues = [];
            this.props.rootStore.dataStore.timepoints.forEach((d) => {
                d.heatmap.forEach((f) => {
                    if (f.variable === this.props.rootStore.dataStore.globalPrimary) {
                        allValues = allValues.concat(f.data.map(element => element.value));
                    }
                });
            });
            legend = this.getCategoricalLegend(primaryVariable,
                allValues, 1, fontSize, this.props.rootStore.visStore.primaryHeight);
        } else if (primaryVariable.datatype === 'BINARY') {
            legend = this.getBinaryLegend(1, fontSize,
                this.props.rootStore.visStore.primaryHeight, primaryVariable.colorScale);
        } else {
            legend = this.getContinuousLegend(1, fontSize,
                this.props.rootStore.visStore.primaryHeight, primaryVariable.colorScale);
        }
        return legend;
    }

    /**
     * updates maximum legend withd
     * @param {number} width
     */
    updateMaxWidth(width) {
        if (width > this.maxWidth) {
            this.maxWidth = width;
        }
    }


    render() {
        const textHeight = 10;
        let legends = [];

        if (!this.props.uiStore.globalTime) {
            this.props.rootStore.dataStore.timepoints.forEach((d, i) => {
                const transform = `translate(0,${this.props.rootStore.visStore.timepointPositions.timepoint[i]})`;

                const lg = this.getBlockLegend(d.heatmap, d.primaryVariableId, textHeight,
                    this.props.rootStore.dataStore.variableStores[d.type].fullCurrentVariables);
                legends.push(
                    <g
                        key={d.globalIndex}
                        transform={transform}
                    >
                        {lg}
                    </g>,
                );
            });
        } else {
            const primaryVariable = this.props.rootStore.dataStore.variableStores.sample
                .fullCurrentVariables.filter(variable => variable.id
                    === this.props.rootStore.dataStore.globalPrimary)[0];
            legends = this.getGlobalLegend(textHeight, primaryVariable);
        }
        return (
            <div className="scrollableX">
                <svg width={this.maxWidth} height={this.props.rootStore.visStore.svgHeight}>
                    {legends}
                </svg>
            </div>
        );
    }
}));
export default Legend;
