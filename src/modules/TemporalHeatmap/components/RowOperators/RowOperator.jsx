import React from 'react';
import {observer} from 'mobx-react';


/*
implements the icons and their functionality on the left side of the plot
 */
const RowOperator = observer(class RowOperator extends React.Component {
        constructor() {
            super();
            this.sortTimepoint = this.sortTimepoint.bind(this);
            this.group = this.group.bind(this);
            this.unGroup = this.unGroup.bind(this);
            this.promote = this.promote.bind(this);
            this.handleDeleteLeave = this.handleDeleteLeave.bind(this);
        }


        /**
         * calls the store function to group a timepoint
         * @param timepoint: timepoint to be grouped
         * @param variable: Variable with which the timepoint will be grouped
         */
        group(timepoint, variable) {
            //console.log(variable,timepoint.type,this.props.store.isContinuous(variable,timepoint.type));
            if (this.props.store.isContinuous(variable, timepoint.type)) {
                this.props.openBinningModal(variable, timepoint.type, this.props.store.groupBinnedTimepoint, timepoint.globalIndex);
            }
            else {
                timepoint.group(variable);
            }
            this.props.store.rootStore.undoRedoStore.saveTimepointHistory("GROUP", variable, timepoint.type, timepoint.localIndex)
        }

        /**
         * sorts a timepoint
         * the variable has to be declared a primary variable, then the timepoint is sorted
         * @param timepoint: timepoint to be sorted
         * @param variable: Variable with which the timepoint should be sorted
         */
        sortTimepoint(timepoint, variable) {
            if (timepoint.isGrouped && this.props.store.isContinuous(variable, timepoint.type)) {
                this.props.openBinningModal(variable, timepoint.type, this.props.store.groupBinnedTimepoint, timepoint.globalIndex);
            }
            else {
                timepoint.sort(variable, this.props.selectedPatients);
                //If we are in realtime mode: apply sorting to all timepoints to avoid crossing lines
                if (this.props.store.rootStore.realTime) {
                    this.props.store.applyPatientOrderToAll(timepoint.globalIndex,false);
                }
            }
            this.props.store.rootStore.undoRedoStore.saveTimepointHistory("SORT", variable, timepoint.type, timepoint.localIndex)
        }


        /**
         * ungoups a grouped timepoint
         * @param timepoint: timepoint to be regrouped
         * @param variable: variable which will be the future primary variable
         */
        unGroup(timepoint, variable) {
            timepoint.unGroup(variable);
            this.props.store.rootStore.undoRedoStore.saveTimepointHistory("UNGROUP", variable, timepoint.type, timepoint.localIndex)
        }

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
            this.props.store.rootStore.undoRedoStore.saveTimepointHistory("PROMOTE", variable, timepoint.type, timepoint.localIndex)
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
            if(timepoint.type==="between"||this.props.store.currentVariables[timepoint.type].length>1) {
                this.props.store.removeVariable(variable, timepoint.type)
            }
            else{
                alert("Samples have to be represented by at least one variable");
            }
        }

        getSortIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseOver={(e) => this.props.showTooltip(e, "Sort timepoint by this variable")}
                       onMouseOut={this.props.hideTooltip}>
                <path fill="gray" d="M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z"/>
                <rect onClick={() => this.sortTimepoint(timepoint, variable)}
                      onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "sort")}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
            </g>);
        }

        getGroupIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                       onMouseEnter={(e) => this.props.showTooltip(e, "Group timepoint by this variable")}
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
                          onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "ungroup")}
                          width={iconScale * 24} height={24}
                          fill="none"
                          pointerEvents="visible"/>
                </g>);
        }

        getAlignIcon(timepoint, variable, iconScale, xPos, yPos) {
            return (
                <g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                   onMouseEnter={(e) => this.props.showTooltip(e, "Realign patients")}
                   onMouseLeave={this.props.hideTooltip}>
                    <path fill="gray"
                          d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"/>
                    <rect onClick={() => this.props.store.applyPatientOrderToAll(timepoint.globalIndex,true)}
                          width={iconScale * 24} height={24}
                          fill="none"
                          pointerEvents="visible"/>
                </g>);
        }

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

        getRowLabel(timepoint, variable, name_var, desc, xPos, yPos, iconScale, width, fontWeight, fontSize) {
            if(!name_var) name_var="";

            var tooltip1="Click to promote variable",
                tooltip2="\n" + name_var,
                tooltip3="\n" + desc;

            var tooltip=tooltip1+tooltip2+tooltip3;

            //var tooltip=[tooltip1, tooltip2, tooltip3];

            //console.log(tooltip);

            
            return (<g transform={"translate(" + xPos + "," + yPos + ")scale(" + iconScale + ")"}
                      //onMouseEnter={(e) => this.props.showTooltip(e, "Promote variable " + name_var + 
                      //                                    " "
                      //                                  +desc)}

                    //onMouseEnter={(e) => this.props.showTooltip(e, tooltip.split ('\n').map ((item, i) => item))} 
                    
                    onMouseEnter={(e) => this.props.showTooltip(e, tooltip)}   
                    onMouseLeave={this.props.hideTooltip}>
                <text style={{fontWeight: fontWeight, fontSize: fontSize}}
                    onContextMenu={(e) => this.props.showContextMenu(e, timepoint.globalIndex, variable, "promote")}
                    onClick={() => this.promote(timepoint, variable)}>{RowOperator.cropText(this.props.store.variableStore[timepoint.type].getById(variable, timepoint.type).name, fontSize, fontWeight, width)}</text>
            </g>);
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
            return this.props.timepoint.heatmap.map(function (d, i) {
                let lineHeight;
                let fontWeight;
                if (d.variable === _self.props.timepoint.primaryVariableId) {
                    lineHeight = _self.props.visMap.primaryHeight;
                    fontWeight = "bold";
                }
                else {
                    lineHeight = _self.props.visMap.secondaryHeight;
                    fontWeight = "normal";
                }
                const transform = "translate(0," + pos + ")";
                const iconScale = (_self.props.visMap.secondaryHeight - _self.props.visMap.gap) / 20;
                let fontSize = 14;
                if (lineHeight < fontSize) {
                    fontSize = Math.round(lineHeight);
                }
                pos = pos + lineHeight + _self.props.visMap.gap;
                const yPos = -(iconScale * 24 - lineHeight) / 2;
                let secondIcon;
                if (!_self.props.timepoint.isGrouped) {
                    secondIcon = _self.getGroupIcon(_self.props.timepoint, d.variable, iconScale, _self.props.width - iconScale * 72, yPos)
                }
                else {
                    secondIcon = _self.getUnGroupIcon(_self.props.timepoint, d.variable, iconScale, _self.props.width - iconScale * 72, yPos)

                }
                let highlightRect = null;
                if (d.variable === _self.props.highlightedVariable) {
                    highlightRect = RowOperator.getHighlightRect(lineHeight, 200);
                }

                
                var desc;

                var name_var;
                
                if(_self.props.store.rootStore.clinicalSampleCategories.filter(d1=>d1.id===d.variable)[0]){
                    name_var=_self.props.store.currentVariables.sample.filter(d1=>d1.id===d.variable)[0].name; //d.variable;
                    desc=": "+_self.props.store.rootStore.clinicalSampleCategories.filter(d1=>d1.id===d.variable)[0].description;
                }
                else if(_self.props.store.currentVariables.sample.filter(d1=>d1.id===d.variable).length===0){
                    desc="";
                }
                else{
                    //name_var=_self.props.store.currentVariables.sample.filter(d1=>d1.id===d.variable)[0].originalIds[0];
                    name_var=_self.props.store.currentVariables.sample.filter(d1=>d1.id===d.variable)[0].name;
                    if(_self.props.store.rootStore.clinicalSampleCategories.filter(d1=>d1.id===name_var)[0]){
                        desc=": "+_self.props.store.rootStore.clinicalSampleCategories.filter(d1=>d1.id===name_var)[0].description;
                    }
                    else{
                        desc="";
                    }

                }

                

                return <g key={d.variable} className={"clickable"} transform={transform}>
                    {highlightRect}
                    {_self.getRowLabel(_self.props.timepoint, d.variable, name_var, desc, 0, (lineHeight + fontSize/2) / 2, iconScale, _self.props.width - iconScale* 24, fontWeight, fontSize)}
                    {_self.getSortIcon(_self.props.timepoint, d.variable, iconScale, (_self.props.width - iconScale * 96), yPos)}
                    {secondIcon}
                    {_self.getAlignIcon(_self.props.timepoint, d.variable, iconScale, (_self.props.width - iconScale * 48), yPos)}
                    {_self.getDeleteIcon(_self.props.timepoint, d.variable, iconScale, (_self.props.width - iconScale * 24), yPos)}
                </g>
            });

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
export default RowOperator;
