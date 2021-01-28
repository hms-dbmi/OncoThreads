import React from "react"
import { observer, inject } from 'mobx-react';

import { IRootStore, IUndoRedoStore } from 'modules/Type'
import { observable } from "mobx";

import { getTextWidth, getScientificNotation, ColorScales } from 'modules/TemporalHeatmap/UtilityClasses/'
import { TColorScale, TRow, TVariable } from "modules/Type/Store";

interface Props {
    rootStore?: IRootStore,
    undoRedoStore?: IUndoRedoStore
}

@inject('rootStore', 'uiStore', 'undoRedoStore')
@observer
class FeatureLegend extends React.Component<Props> {
    rowWidths: {[id:string]:number} = {};
    horizontalGap: number = 5;
    @observable defaultWidth = 100;
    @observable minCatWidth = 30;
    @observable svgWidth = 100
    /**
     * updates maximum legend wid th
    */
    updateRowWidths(op:'add'|'delete', id:string, width?: number) {
        if (op==='add' && typeof width === 'number'){
            this.rowWidths[id] = width
        } else if (op==='delete'){
            delete this.rowWidths[id]
        }
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

        variable.domain.forEach((d: string, i: number) => {
            if (variable.datatype === 'ORDINAL' || row.includes(d)) {
                let tooltipText='';
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
        this.updateRowWidths('add', variable.id, currX);
        return <g className='categoricalLegend' key='categoricalLegend'>{legendEntries}</g>;
    }

    /**
     * gets a legend for a binary variable
     * @param {number} opacity
     * @param {number} fontSize
     * @param {number} lineheight
     * @param {function} color
     * @returns {Array}
     */
    getBinaryLegend(variable:TVariable, opacity: number, fontSize: number, lineheight: number, color: TColorScale) {
        let legendEntries: any[] = [];
        legendEntries = legendEntries.concat(this.getLegendEntry('true', opacity, getTextWidth('true', fontSize) + 4, fontSize, 0, lineheight, color(true), 'black'));
        legendEntries = legendEntries.concat(this.getLegendEntry('false', opacity, getTextWidth('false', fontSize) + 4, fontSize, getTextWidth('true', fontSize) + 6, lineheight, color(false), 'black'));
        
        this.updateRowWidths('add', variable.id,74 + getTextWidth(variable.name, fontSize));
        
        return <g className='binaryLegend' key={'binaryLegend'}>{legendEntries}</g>;
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

    removeVariable(id:string, name:string){
        const { dataStore } = this.props.rootStore!;
        const {undoRedoStore} = this.props
        dataStore.variableStores['between'].removeVariable(id);
        undoRedoStore?.saveVariableHistory('REMOVE', name, true);
        this.updateRowWidths('delete', id)
    }

    getLegend() {
        let { dataStore } = this.props.rootStore!
        let lineheight: number = this.props.rootStore!.visStore.secondaryHeight;
        let adaptedFontSize = 12;
        let opacity = 0.5;

        const maxVarWidth = Math.max(...dataStore.variableStores.between.currentVariables
            .map((varID: string) => getTextWidth(dataStore.variableStores.between.referencedVariables[varID].name, adaptedFontSize)))

        return dataStore.variableStores.between.currentVariables
            .map((variableID: string, variableIdx: number) => {
                let variable = dataStore.variableStores.between.referencedVariables[variableID]

                let colorScale = variable.colorScale
                let legendEntries: JSX.Element[] = [];

                if (variable.datatype === 'STRING' || variable.datatype === 'ORDINAL') {
                    legendEntries = [this.getCategoricalLegend(variable, variable.domain, opacity, adaptedFontSize, lineheight)];
                } else if (variable.datatype === 'BINARY') {
                    legendEntries = [this.getBinaryLegend(variable, opacity, adaptedFontSize, lineheight, colorScale)];
                } 
                let leTransform = `translate(0,${variableIdx * lineheight})`;


                return <g className="eventLegend" transform={leTransform} key={`${variableID}_${variableIdx}`}>
                    <text y={(lineheight+ adaptedFontSize)/2} fontSize={adaptedFontSize}> 
                        {variable.name}
                    </text>
                    <text x= {maxVarWidth + this.horizontalGap} y={(lineheight+ adaptedFontSize)/2} 
                        fontSize={adaptedFontSize} onClick={()=>this.removeVariable(variable.id, variable.name)}
                        cursor="default">
                        X
                    </text>
                    <g transform={`translate(${maxVarWidth + getTextWidth(' X ', adaptedFontSize) + 2*this.horizontalGap}, 0)`}>
                        {legendEntries}
                    </g>
                </g>
            })


    }

    componentDidMount(){
        this.svgWidth = Math.max(...Object.values(this.rowWidths))
    }

    componentDidUpdate(){
        this.svgWidth = Math.max(...Object.values(this.rowWidths))
    }

    render() {
        let { dataStore } = this.props.rootStore!
        
        // let height = this.props.cellHeight * dataStore.currentVariables.length, width = this.maxWidth
        let content = this.getLegend()
        let lineheight: number = this.props.rootStore!.visStore.secondaryHeight,
            height = lineheight * dataStore.variableStores.between.currentVariables.length,
            width = this.svgWidth

        return <svg width={width} height={height}>
            <rect width={width} height={height} fill='white'/>
            <g className="eventLegend" >
                {content}
            </g>
        </svg>
    }
}

export default FeatureLegend