import React from 'react';
import { observer, inject } from 'mobx-react';

/**
 * Component for a a row operators of a timepont type in the Global timeline
 */
const GlobalRowOperator = inject('dataStore', 'visStore', 'undoRedoStore')(observer(class GlobalRowOperator extends React.Component {
    /**
         * computes the width of a text. Returns 30 if the text width would be shorter than 30
         * @param {string} text
         * @param {number} fontSize
         * @param {*} fontweight
         * @param {number} maxWidth
         * @returns {string}
         */
    static cropText(text, fontSize, fontweight, maxWidth) {
        let returnText = text;
        const context = document.createElement('canvas').getContext('2d');
        context.font = `${fontweight} ${fontSize}px Arial`;
        const width = context.measureText(text).width;
        if (width > maxWidth) {
            for (let i = 1; i < text.length; i += 1) {
                const prevText = text.substr(0, i - 1).concat('...');
                const currText = text.substr(0, i).concat('...');
                const prevWidth = context.measureText(prevText).width;
                const currWidth = context.measureText(currText).width;
                if (currWidth > maxWidth && prevWidth < maxWidth) {
                    returnText = prevText;
                    break;
                }
            }
        }
        return returnText;
    }

    constructor() {
        super();
        this.promote = this.promote.bind(this);
        this.position = 0;
    }


    /**
         * creates a delete icon and associates it with the delete function
         * @param {Object} timepoint
         * @param {string} variableId
         * @param {number} iconScale
         * @param {number} xPos
         * @param {number} yPos
         * @return {g} icon
         */
    getDeleteIcon(timepoint, variableId, iconScale, xPos, yPos) {
        return (
            <g
                className="not_exported"
                key={`delete${variableId}`}
                transform={`translate(${xPos},${yPos})scale(${iconScale})`}
                onMouseEnter={e => this.props.showTooltip(e, 'Delete variable from all blocks ')}
                onMouseLeave={this.props.hideTooltip}
            >
                <path
                    fill="gray"
                    d="M12.12,10,20,17.87,17.87,20,10,12.12,2.13,20,0,17.87,7.88,10,0,2.13,2.13,0,10,7.88,17.87,0,20,2.13Z"
                />
                <rect
                    onClick={() => this.handleDelete(variableId, timepoint)}
                    width={iconScale * 24}
                    height={24}
                    fill="none"
                    pointerEvents="visible"
                />
            </g>
        );
    }

    /**
         * creates the label for a row
         * @param {Object} timepoint
         * @param {string} variableId
         * @param {number} yPos
         * @param {number} iconScale
         * @param {number} width
         * @param {*} fontWeight
         * @param {number} fontSize
         * @return {*}
         */
    getRowLabel(timepoint, variableId, yPos, iconScale, width, fontWeight, fontSize) {
        const currVar = this.props.dataStore.variableStores[timepoint.type].getById(variableId);
        let label;
        if (timepoint.type === 'between') {
            if (this.props.dataStore.variableStores[timepoint.type].isEventDerived(variableId)) {
                // let labels = [];
                // let oIds = currVar.originalIds;
                label = (
                    <g
                        key={currVar.id}
                        onMouseEnter={e => this.props.showTooltip(e, currVar.name,
                            currVar.description)}
                        onMouseLeave={this.props.hideTooltip}
                    >

                        <text style={{ fontWeight, fontSize }}>
                            {GlobalRowOperator.cropText(currVar.name, fontSize,
                                fontWeight, width - iconScale * 24 - fontSize)}
                        </text>
                        {this.getDeleteIcon(timepoint, variableId, iconScale,
                            this.props.width - iconScale * 24, -fontSize)}
                        <rect
                            key="rect"
                            width={fontSize}
                            height={fontSize}
                            x={this.props.width - iconScale * 24 - fontSize}
                            y={-fontSize + 2}
                            fill={this.props.visStore.globalTimelineColors(currVar.id)}
                            opacity={0.5}
                        />
                    </g>
                );
                this.position += this.props.visStore.secondaryHeight;
            }
        } else {
            label = (
                <g
                    onMouseEnter={e => this.props.showTooltip(e, `Promote variable ${currVar.name}`, currVar.description)}
                    onMouseLeave={this.props.hideTooltip}
                >
                    <text
                        style={{ fontWeight, fontSize }}
                        onClick={() => this.promote(variableId)}
                    >
                        {GlobalRowOperator.cropText(this.props.dataStore
                            .variableStores[timepoint.type]
                            .getById(variableId, timepoint.type).name,
                        fontSize, fontWeight, width - iconScale * 24)}
                    </text>
                    {this.getDeleteIcon(timepoint, variableId, iconScale,
                        this.props.width - iconScale * 24, -fontSize)}
                </g>
            );
            this.position += this.props.visStore.secondaryHeight;
        }
        return label;
    }

    /**
         * Creates the Row operator for a timepoint
         */
    getRowOperator() {
        this.position = this.props.visStore.secondaryHeight;
        if (this.props.timepoint) {
            return this.props.timepoint.heatmap.map((d) => {
                let lineHeight;
                let fontWeight;
                if (d.variable === this.props.dataStore.globalPrimary) {
                    lineHeight = this.props.visStore.secondaryHeight;
                    fontWeight = 'bold';
                } else {
                    lineHeight = this.props.visStore.secondaryHeight;
                    fontWeight = 'normal';
                }
                const transform = `translate(0,${this.position})`;
                const iconScale = (this.props.visStore.secondaryHeight) / 24;
                let fontSize = 10;
                if (lineHeight < fontSize) {
                    fontSize = Math.round(lineHeight);
                }
                return (
                    <g key={d.variable} className="clickable" transform={transform}>
                        {this.getRowLabel(this.props.timepoint, d.variable,
                            (lineHeight + fontSize / 2) / 2,
                            iconScale, this.props.width, fontWeight, fontSize)}
                    </g>
                );
            });
        }
        return null;
    }

    /**
     * handles deleting a timepoint
     * @param {string} variableId
     * @param {Object} timepoint
     */
    handleDelete(variableId, timepoint) {
        if (timepoint.type === 'between' || this.props.dataStore.variableStores[timepoint.type].currentVariables.length > 1) {
            this.props.dataStore.variableStores[timepoint.type].removeVariable(variableId);
            if (timepoint.type === 'sample') {
                this.promote(this.props.dataStore.variableStores.sample.currentVariables[0]);
            }
        } else {
            alert('Samples have to be represented by at least one variable');
        }
    }

    /**
     * promotes a variable at a timepoint to a primary variable
     * @param {string} variableId - variable to be the primary variable
     */
    promote(variableId) {
        this.props.dataStore.setGlobalPrimary(variableId);
        this.props.undoRedoStore.saveGlobalHistory('PROMOTE');
    }

    render() {
        return (
            <svg width={this.props.width} height={this.props.height}>
                <g transform={this.props.transform}>
                    {this.getRowOperator()}
                </g>
            </svg>
        );
    }
}));
export default GlobalRowOperator;
