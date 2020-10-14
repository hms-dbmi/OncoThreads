import React from "react"
import { observer, inject } from 'mobx-react';
import {v4 as uuidv4} from 'uuid';

import { IRootStore } from 'modules/Type'
import { observable } from "mobx";

import { getTextWidth, getScientificNotation, ColorScales } from 'modules/TemporalHeatmap/UtilityClasses/'
import { TColorScale, TRow, TVariable } from "modules/Type/Store";

interface Props {
    rootStore?: IRootStore,
    cellHeight: number
}

@inject('rootStore', 'uiStore')
@observer
class FeatureLegend extends React.Component<Props> {
    @observable maxWidth: number = 100;
    @observable defaultWidth = 100;
    @observable minCatWidth = 30;
    /**
     * updates maximum legend wid th
    */
    updateMaxWidth(width: number) {
        if (width > this.maxWidth) {
            this.maxWidth = width;
        }
    }


    /**
     * gets a legend (i.e., one row) for a continuous variable
     * @param {number} opacity
     * @param {number} fontSize
     * @param {number} lineheight
     * @param {function} color
     * @returns {(g|null)}
     */
    getContinuousLegend(variableName:string, opacity: number, fontSize: number, lineheight: number, color: TColorScale) {
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
                        {getScientificNotation(min)}
                    </text>,
                    <text
                        key="text med"
                        fill={ColorScales.getHighContrastColor(color(0))}
                        style={{ fontSize }}
                        x={this.defaultWidth / 2 - getTextWidth(0, fontSize) / 2}
                        y={lineheight / 2 + fontSize / 2}
                    >
                        {0}
                    </text>,
                    <text
                        key="text max"
                        fill={ColorScales.getHighContrastColor(color(max))}
                        style={{ fontSize }}
                        x={this.defaultWidth - getTextWidth(
                            getScientificNotation(max)!, fontSize)}
                        y={lineheight / 2 + fontSize / 2}
                    >
                        {getScientificNotation(max)}
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
                        {getScientificNotation(min)}
                    </text>,
                    <text
                        key="text max"
                        fill={ColorScales.getHighContrastColor(color(max))}
                        style={{ fontSize }}
                        x={this.defaultWidth - getTextWidth(getScientificNotation(max)!, fontSize)}
                        y={lineheight / 2 + fontSize / 2}
                    >
                        {getScientificNotation(max)}
                    </text>,
                );
            }
            this.updateMaxWidth(this.defaultWidth);
            return (
                <g  key={variableName}>
                    <defs>
                        <linearGradient id={`gradient_${variableName}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: color(min) }} />
                            {intermediateStop}
                            <stop offset="100%" style={{ stopColor: color(max) }} />
                        </linearGradient>
                    </defs>
                    <rect opacity={opacity} x="0" y="0" width={this.defaultWidth} height={lineheight} fill={`url(#gradient_${variableName})`} />
                    {text}
                </g>
            );
        }

        return <g/>;
    }

    /**
     * gets a legend (one row) for a categorical variable
     * @param {(DerivedVariable|OriginalVariable)} variable
     * @param {Object[]} row
     * @param {number} opacity
     * @param {number} fontSize
     * @param {number} lineheight
     * @returns {g[]}
     */
    getCategoricalLegend(variable: TVariable, row: TRow, opacity: number, fontSize: number, lineheight: number) {
        let currX = 0;
        const legendEntries: JSX.Element[] = [];
        let legend_y = lineheight;

        variable.domain.forEach((d:string, i:number) => {
            if (variable.datatype === 'ORDINAL' || row.includes(d)) {
                let tooltipText;
                if (variable.derived && variable.datatype === 'ORDINAL' && variable.modification.type === 'continuousTransform' && variable.modification.binning.binNames[i].modified) {
                    tooltipText = `${d}: ${getScientificNotation(variable.modification.binning.bins[i])} to ${getScientificNotation(variable.modification.binning.bins[i + 1])}`;
                } else {
                    tooltipText = d;
                }
                const rectWidth = getTextWidth(d, fontSize) + 4;
                if (d !== undefined) {


                    legendEntries.push(this.getLegendEntry(d, opacity, rectWidth,
                        fontSize, currX, lineheight, variable.colorScale(d),
                        ColorScales.getHighContrastColor(variable.colorScale(d))));
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
     * @param {function} color
     * @returns {Array}
     */
    getBinaryLegend(opacity: number, fontSize: number, lineheight: number, color: TColorScale) {
        let legendEntries: any[] = [];
        legendEntries = legendEntries.concat(this.getLegendEntry('true', opacity, getTextWidth('true', fontSize) + 4, fontSize, 0, lineheight, color(true), 'black'));
        legendEntries = legendEntries.concat(this.getLegendEntry('false', opacity, getTextWidth('false', fontSize) + 4, fontSize, getTextWidth('true', fontSize) + 6, lineheight, color(false), 'black'));
        this.updateMaxWidth(74);
        return legendEntries;
    }

    /**
    * gets a single entry (i.e., a rectangle) of the legend
    * @param {string} value - text to display
    * @param {number} opacity - 1 if primary, lower for secondary
    * @param {number} rectWidth
    * @param {number} fontSize
    * @param {number} currX - current x position
    * @param {number} lineheight
    * @param {string} rectColor
    * @param {string} textColor
    */

    getLegendEntry(value: string, opacity: number, rectWidth: number, fontSize: number, currX: number, lineheight: number, rectColor: string, textColor: string) {

        return (<g
            key={value}
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

    getLegend() {
        let { dataStore } = this.props.rootStore!
        let lineheight:number = this.props.rootStore!.visStore.secondaryHeight;
        let adaptedFontSize = 10;
        let opacity = 0.5;

        return dataStore.currentVariables
            .map((variableName:string,variableIdx) => {
                let variable = dataStore.referencedVariables[variableName]
                let colorScale = dataStore.colorScales[variableIdx]
                let legendEntries: JSX.Element[] = [];

                if (variable.datatype === 'STRING' || variable.datatype === 'ORDINAL') {
                    legendEntries = this.getCategoricalLegend(variable, variable.domain, opacity, adaptedFontSize, lineheight);
                } else if (variable.datatype === 'BINARY') {
                    legendEntries = this.getBinaryLegend(opacity, adaptedFontSize,
                        lineheight, colorScale);
                } else {
                    legendEntries = [this.getContinuousLegend(variableName, opacity, adaptedFontSize,
                        lineheight, colorScale)];
                }
                let leTransform = `translate(0,${variableIdx*this.props.cellHeight})`;

                return <g className="featureLegend" transform={leTransform} key={`${variableName}_${variableIdx}`}>
                    {legendEntries}
                </g>
            })


    }

    render(){
        let { dataStore } = this.props.rootStore!
        let height = this.props.cellHeight * dataStore.currentVariables.length
        let content = this.getLegend()
        return <svg width={this.maxWidth} height={height} className="featureLegend">
            {content}
        </svg>
    }
}

export default FeatureLegend