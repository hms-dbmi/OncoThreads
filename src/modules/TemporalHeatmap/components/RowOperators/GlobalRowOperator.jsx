import React from 'react';
import {observer} from 'mobx-react';


/*
implements the icons and their functionality on the left side of the plot
 */
const GlobalRowOperator = observer(class GlobalRowOperator extends React.Component {
        constructor() {
            super();
            //this.sortTimepoint = this.sortTimepoint.bind(this);
            //this.group = this.group.bind(this);
            //this.unGroup = this.unGroup.bind(this);
            this.promote = this.promote.bind(this);
            this.handleDeleteLeave = this.handleDeleteLeave.bind(this);
        }


        /**
         * calls the store function to group a timepoint
         * @param timepoint: timepoint to be grouped
         * @param variable: Variable with which the timepoint will be grouped
         */
        /*group(timepoint, variable) {
            console.log(variable,timepoint.type,this.props.store.isContinuous(variable,timepoint.type));
            if (this.props.store.isContinuous(variable, timepoint.type)) {
                this.props.openBinningModal(variable, timepoint.type, this.props.store.groupBinnedTimepoint, timepoint.globalIndex);
            }
            else {
                timepoint.group(variable);
            }
        }*/

        /**
         * sorts a timepoint
         * the variable has to be declared a primary variable, then the timepoint is sorted
         * @param timepoint: timepoint to be sorted
         * @param variable: Variable with which the timepoint should be sorted
         */
        /*sortTimepoint(timepoint, variable) {
            if (timepoint.isGrouped && this.props.store.isContinuous(variable, timepoint.type)) {
                this.props.openBinningModal(variable, timepoint.type, this.props.store.groupBinnedTimepoint, timepoint.globalIndex);
            }
            else {
                timepoint.sort(variable, this.props.selectedPatients);
                //If we are in realtime mode: apply sorting to all timepoints to avoid crossing lines
                if (this.props.store.rootStore.realTime) {
                    this.props.store.applyPatientOrderToAll(timepoint.globalIndex);
                }
            }
        }*/


        /**
         * ungoups a grouped timepoint
         * @param timepoint: timepoint to be regrouped
         * @param variable: variable which will be the future primary variable
         */
        /*unGroup(timepoint, variable) {
            timepoint.unGroup(variable);
        }*/

        /**
         * promotes a variable at a timepoint to a primary variable
         * @param timepoint: timepoint where the primary variable is changes
         * @param variable: variable to be the primary variable
         */

        promote(timepoint, variable) {
           if (timepoint.isGrouped && this.props.store.isContinuous(variable, timepoint.type)) {
                this.props.openBinningModal(variable, timepoint.type, this.props.store.promoteBinnedTimepoint, timepoint.globalIndex);
            }
            else {
                timepoint.promote(variable);
            }


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
         * highlights variable for deletion and shows tooltip
         * @param e
         * @param variable
         */
        handleDeleteEnter(e, variable) {
            this.props.highlightVariable(variable);
            this.props.showTooltip(e, "Delete variable from all timepoints")
        }

        /**
         * unhighlights variable for deletion and hides tooltip
         */
        handleDeleteLeave() {
            this.props.unhighlightVariable();
            this.props.hideTooltip();
        }

        /**
         * handle click on delete button
         * @param variable
         * @param timepoint
         */
        handleDelete(variable, timepoint) {
            this.props.unhighlightVariable();
            this.props.hideTooltip();
            this.props.store.removeVariable(variable, timepoint.type)
        }

        /*getSortIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseOver={(e) => this.props.showTooltip(e, "Sort timepoint after this variable")}
                       onMouseOut={this.props.hideTooltip}>
                <path fill="gray" d="M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z"/>
                <rect onClick={() => this.sortTimepoint(timepoint, variable)}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "sort")}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
            </g>);
        }*/

        /*getGroupIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseEnter={(e) => this.props.showTooltip(e, "Group timepoint after this variable")}
                       onMouseLeave={this.props.hideTooltip}>
                <path fill="gray"
                      d="M12.5,19.5V3.47H14.53V19.5H12.5M9.5,19.5V3.47H11.53V19.5H9.5M4.5,7.5L8.53,11.5L4.5,15.47V12.47H1.5V10.5H4.5V7.5M19.5,15.47L15.5,11.5L19.5,7.5V10.5H22.5V12.47H19.5V15.47Z"/>
                <rect onClick={() => this.group(timepoint, variable)}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "group")}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
            </g>);
        }

        getUnGroupIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (
                <g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                   onMouseEnter={(e) => this.props.showTooltip(e, "Ungroup timepoint")}
                   onMouseLeave={this.props.hideTooltip}>
                    <path fill="gray"
                          d="M9,11H15V8L19,12L15,16V13H9V16L5,12L9,8V11M2,20V4H4V20H2M20,20V4H22V20H20Z"/>
                    <rect onClick={() => this.unGroup(timepoint, variable)}
                          onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "group")}
                          width={iconScale * 24} height={24}
                          fill="none"
                          pointerEvents="visible"/>
                </g>);
        }*/

        getDeleteIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (
                <g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                   onMouseEnter={(e) => this.handleDeleteEnter(e, variable)}
                   onMouseLeave={this.handleDeleteLeave}>
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

        getRowLabel(timepoint, variable, xPos, yPos, iconScale, width, fontWeight, fontSize) {
            /* return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                        onMouseEnter={(e) => this.props.showTooltip(e, "Promote this variable")}
                        onMouseLeave={this.props.hideTooltip}>
                 <text style={{fontWeight: fontWeight, fontSize: fontSize}}
                       onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable,"promote")}
                       onClick={() => this.promote(timepoint, variable)}>{GlobalRowOperator.cropText(this.props.store.variableStore[timepoint.type].getById(variable,timepoint.type).name, fontSize, fontWeight, width)}</text>
             </g>);*/

            const _self = this;

            let fillC="#F00";
            if (this.props.store.variableStore[timepoint.type].getById(variable, timepoint.type).datatype === "binary") {

                let labels = [];
                //var txtR=[];
                let oIds = _self.props.store.variableStore[timepoint.type].getById(variable).originalIds;

                //console.log(variable);

                oIds.forEach(function (element, i) {

                    let name = _self.props.store.variableStore[timepoint.type].getByIdAllVariables(element).name;


                    //console.log(name1);

                    //console.log(orId);
                    let c1 = _self.props.visMap.globalTimelineColors;
                    //let fillC = c1(element);

                    if(fillC==="#F00"){
                        fillC = c1(element);
                    }

                    //console.log(fillC);

                    let xT = GlobalRowOperator.getTextWidth(name, fontSize);

                    //console.log(xT);


                    labels.push(<g key={element}
                        transform={"translate(" + xPos + "," + (yPos + i * _self.props.store.rootStore.visStore.secondaryHeight) + ")scale(" + iconScale + ")"}

                        onMouseLeave={_self.props.hideTooltip}>

                        <rect key={"rect"} opacity={1} width={15} height={15}
                              x={xPos + xT + 5} y={yPos - 25}
                              fill={fillC}
                              opacity={0.5}
                              
                              />
                        <text style={{fontWeight: fontWeight, fontSize: fontSize}}
                             //onClick={() => this.promote(timepoint, variable)}
                             > 
                             {GlobalRowOperator.cropText(name, fontSize, fontWeight, width)}
                           
                           
                            </text>
                    </g>);


                });

                return labels;

            }

            else {
                return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}

                           onMouseLeave={this.props.hideTooltip}>

                    <text style={{fontWeight: fontWeight, fontSize: fontSize}}
                         // onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "promote")}


                          onClick={() => this.promote(timepoint, variable)}
                          >
                          {GlobalRowOperator.cropText(this.props.store.variableStore[timepoint.type].getById(variable,timepoint.type).name, fontSize, fontWeight, width)}
                       
                       
                        </text>
                </g>);

            }
        }

        static getHighlightRect(height, width) {
            return <rect height={height} width={width} fill="#e8e8e8"/>
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
                       lineHeight =  _self.props.visMap.secondaryHeight;// _self.props.visMap.primaryHeight;
                       fontWeight = "bold";
                    }
                    else {
                        lineHeight = _self.props.visMap.secondaryHeight;
                        fontWeight = "normal";
                    }
                    const transform = "translate(0," + pos + ")";
                    const iconScale = (_self.props.visMap.secondaryHeight - _self.props.visMap.gap) / 20;
                    let fontSize = 12;
                    if (lineHeight < fontSize) {
                        fontSize = Math.round(lineHeight);
                    }
                    let numVar = 1;
                    let variable = _self.props.store.variableStore[_self.props.timepoint.type].getById(d.variable, _self.props.timepoint.type)
                    if (variable.datatype === 'binary') {
                        numVar = variable.originalIds.length;
                    }
                    pos = pos + (lineHeight + _self.props.visMap.gap) * numVar;
                    const yPos = -(iconScale * 24 - lineHeight) / 2;
                    /*if (!_self.props.timepoint.isGrouped) {
                        secondIcon = _self.getGroupIcon(_self.props.timepoint, d.variable, iconScale, _self.props.width - iconScale * 48, yPos)
                    }
                    else {
                        secondIcon = _self.getUnGroupIcon(_self.props.timepoint, d.variable, iconScale, _self.props.width - iconScale * 48, yPos)

                    }*/
                    //let highlightRect = null;
                    //if (d.variable === _self.props.highlightedVariable) {
                    //  highlightRect = GlobalRowOperator.getHighlightRect(lineHeight, 200);
                    //}
                    /*return <g key={d.variable} className={"clickable"} transform={transform}>
                        {highlightRect}
                        {_self.getRowLabel(_self.props.timepoint, d.variable, 0, (lineHeight + fontSize) / 2, iconScale, _self.props.width - iconScale * 72, fontWeight, fontSize)}
                        {_self.getSortIcon(_self.props.timepoint, d.variable, iconScale, (_self.props.width - iconScale * 72), yPos)}
                        {secondIcon}
                        {_self.getDeleteIcon(_self.props.timepoint, d.variable, iconScale, (_self.props.width - iconScale * 24), yPos)}
                    </g>*/

                    return <g key={d.variable} className={"clickable"} transform={transform}>
                        {_self.getRowLabel(_self.props.timepoint, d.variable, 0, (lineHeight + fontSize) / 2, iconScale, _self.props.width - iconScale * 72, fontWeight, fontSize)}
                        {_self.getDeleteIcon(_self.props.timepoint, d.variable, iconScale, (_self.props.width - iconScale * 24), yPos + 3)}
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
