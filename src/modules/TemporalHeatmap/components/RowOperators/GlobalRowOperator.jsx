import React from 'react';
import {observer} from 'mobx-react';


/*
implements the icons and their functionality on the left side of the plot
 */
const GlobalRowOperator = observer(class GlobalRowOperator extends React.Component {
        constructor() {
            super();
            this.promote = this.promote.bind(this);
        }

        /**
         * promotes a variable at a timepoint to a primary variable
         * @param timepoint: timepoint where the primary variable is changes
         * @param variable: variable to be the primary variable
         */
        promote(timepoint, variable) {
            this.props.store.rootStore.setGlobalPrimary(variable);
        }

        /**
         * computes the width of a text. Returns 30 if the text width would be shorter than 30
         * @param text
         * @param fontSize
         * @param fontweight
         * @param maxWidth
         * @returns {number}
         */
        static cropText(text, fontSize, fontweight, maxWidth) {
            const context = document.createElement("canvas").getContext("2d");
            context.font = fontweight + " " + fontSize + "px Arial";
            const width = context.measureText(text).width;
            if (width > maxWidth) {
                for (let i = 1; i < text.length; i++) {
                    const context = document.createElement("canvas").getContext("2d");
                    context.font = fontSize + " px Arial";
                    let prevText = text.substr(0, i - 1).concat("...");
                    let currText = text.substr(0, i).concat("...");
                    let prevWidth = context.measureText(prevText).width;
                    let currWidth = context.measureText(currText).width;
                    if (currWidth > maxWidth && prevWidth < maxWidth) {
                        text = prevText;
                        break;
                    }
                }
            }
            return text;
        }

        /**
         * handle click on delete button
         * @param variable
         * @param timepoint
         */
        handleDelete(variable, timepoint) {
            if (timepoint.type === "between" || this.props.store.currentVariables[timepoint.type].length > 1) {
                this.props.store.removeVariable(variable, timepoint.type);

                this.promote(timepoint,
                    this.props.store.currentVariables.sample[this.props.store.currentVariables.sample.length - 1].id);
            }
            else {
                alert("Samples have to be represented by at least one variable");

            }
        }

        getDeleteIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (
                <g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                   onMouseEnter={(e) => this.props.showTooltip(e, "Delete variable from all blocks ")}
                   onMouseLeave={this.props.hideTooltip}>
                    <path fill="gray"
                          d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    <rect onClick={() => this.handleDelete(variable, timepoint)}
                          width={iconScale * 24} height={24}
                          fill="none"
                          pointerEvents="visible"/>
                </g>);
        }

        /**
         * computes the width of a text. Returns 30 if the text width would be shorter than 30
         * @param text
         * @param fontSize
         * @returns {number}
         */
        static getTextWidth(text, fontSize) {
            const minWidth = 30;
            const context = document.createElement("canvas").getContext("2d");
            context.font = fontSize + "px Arial";
            const width = context.measureText(text).width;
            if (width > minWidth) {
                return width;
            }
            else return minWidth;
        }

        getRowLabel(timepoint, variable, yPos, iconScale, width, fontWeight, fontSize) {
            const _self = this;
            let fillC = "#F00";
            const currVar = this.props.store.variableStore[timepoint.type].getById(variable);
            if (timepoint.type === 'between') {
                if (currVar.type === 'event' || currVar.derived) {
                    let labels = [];
                    let oIds = currVar.originalIds;
                    oIds.forEach(function (element, i) {
                        let originalVar = _self.props.store.variableStore[timepoint.type].getByIdAllVariables(element);
                        if (originalVar.type === "event") {
                            let c1 = _self.props.visMap.globalTimelineColors;
                            if (fillC === "#F00") {
                                fillC = c1(element);
                            }
                            let xT = GlobalRowOperator.getTextWidth(originalVar.name, fontSize);
                            labels.push(<g key={element}
                                           transform={"translate(0," + (yPos + i * _self.props.store.rootStore.visStore.secondaryHeight) + ")"}
                                           onMouseEnter={(e) => _self.props.showTooltip(e, originalVar.name, originalVar.description)}
                                           onMouseLeave={_self.props.hideTooltip}>
                                <rect key={"rect"}
                                      width={fontSize} height={fontSize}
                                      x={xT + 5} y={-fontSize+2}
                                      fill={fillC}
                                      opacity={0.5}/>
                                <text style={{fontWeight: fontWeight, fontSize: fontSize}}>
                                    {GlobalRowOperator.cropText(originalVar.name, fontSize, fontWeight, width-iconScale*24)}
                                </text>
                            </g>);
                        }


                    });
                    if(oIds.length>1) {
                        labels.push(<rect width={this.props.width}
                                          height={yPos + (oIds.length - 0.8) * _self.props.store.rootStore.visStore.secondaryHeight}
                                          strokeDasharray="5,5" strokeWidth={1} stroke={"grey"} fill={"none"}/>)
                    }
                        labels.push(_self.getDeleteIcon(timepoint, variable, iconScale, _self.props.width - iconScale * 24,0));
                    return labels;
                }
            }

            else {
                return (<g transform={"translate(0," + yPos + ")"}
                           onMouseEnter={(e) => _self.props.showTooltip(e, "Promote variable " + currVar.name, currVar.description)}
                           onMouseLeave={_self.props.hideTooltip}>>
                    <text style={{fontWeight: fontWeight, fontSize: fontSize}}
                          onClick={() => this.promote(timepoint, variable)}
                    >
                        {GlobalRowOperator.cropText(this.props.store.variableStore[timepoint.type].getById(variable, timepoint.type).name, fontSize, fontWeight, width - iconScale*24)}
                    </text>
                    {_self.getDeleteIcon(timepoint, variable, iconScale, _self.props.width - iconScale * 24,-fontSize-2)}
                </g>);

            }
        }

        /**
         * Creates the Row operator for a timepoint
         */
        getRowOperator() {
            const _self = this;
            let pos = 0;
            if (this.props.timepoint) {
                return this.props.timepoint.heatmap.map(function (d, i) {
                    let lineHeight;
                    let fontWeight;
                    if (d.variable === _self.props.store.rootStore.globalPrimary) {
                        lineHeight = _self.props.visMap.secondaryHeight;// _self.props.visMap.primaryHeight;
                        fontWeight = "bold";
                    }
                    else {
                        lineHeight = _self.props.visMap.secondaryHeight;
                        fontWeight = "normal";
                    }
                    const transform = "translate(0," + pos + ")";
                    const iconScale = (_self.props.visMap.secondaryHeight - _self.props.visMap.gap) / 20;
                    let fontSize = 10;
                    if (lineHeight < fontSize) {
                        fontSize = Math.round(lineHeight);
                    }
                    let numVar = 1;
                    let variable = _self.props.store.variableStore[_self.props.timepoint.type].getById(d.variable, _self.props.timepoint.type);
                    if (variable.datatype === 'binary') {
                        numVar = variable.originalIds.length;
                    }
                    pos = pos + (lineHeight + _self.props.visMap.gap) * numVar;
                    return <g key={d.variable} className={"clickable"} transform={transform}>
                        {_self.getRowLabel(_self.props.timepoint, d.variable, (lineHeight + fontSize / 2) / 2, iconScale, _self.props.width, fontWeight, fontSize)}
                    </g>

                });
            }
            else return null;

        }

        render() {
            return (
                <g transform={this.props.transform}>
                    {this.getRowOperator()}
                </g>
            )
        }
    }
    )
;
export default GlobalRowOperator;
