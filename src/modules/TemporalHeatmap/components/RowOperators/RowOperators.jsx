import React from 'react';
import {observer} from 'mobx-react';

const RowOperators = observer(class RowOperators extends React.Component {
    constructor() {
        super();
        this.sort = this.sort.bind(this);
        this.group = this.group.bind(this);
        this.unGroup = this.unGroup.bind(this);
        this.promote = this.promote.bind(this);
    }

    group(timepoint, variable) {
        this.props.store.setPrimaryVariable(timepoint, variable);
        this.props.store.groupTimepoint(timepoint, variable);
        this.props.store.sortGroups(timepoint, 1);
    }

    sort(timepoint, variable) {
        if (this.props.groupOrder[timepoint].isGrouped) {
            if (this.props.store.primaryVariables[timepoint] !== variable) {
                this.props.store.setPrimaryVariable(timepoint, variable);
                this.props.store.groupTimepoint(timepoint, variable);
            }
            this.props.store.sortGroups(timepoint, -this.props.groupOrder[timepoint].order);
        }
        else {
            this.props.store.setPrimaryVariable(timepoint, variable);
            this.props.store.sortHeatmapTimepoint(timepoint, variable);
        }
    }

    unGroup(timepoint, variable) {
        this.props.store.unGroupTimepoint(timepoint, variable);
    }

    promote(timepoint, variable) {
        this.props.store.setPrimaryVariable(timepoint, variable);
        if (this.props.groupOrder[timepoint].isGrouped) {
            this.props.store.groupTimepoint(timepoint, variable);
            this.props.store.sortGroups(timepoint, this.props.groupOrder[timepoint].order);
        }
    }

    getRowOperator(timepoint, icon1, icon2, function1, function2) {
        const _self = this;
        let pos = 0;
        let currentVariables=[];
        if(this.props.store.timepointData[timepoint].type==="between"){
            currentVariables=this.props.currentBetweenVariables;
        }
        else{
            currentVariables=this.props.currentSampleVariables;
        }
        return currentVariables.map(function (d, i) {
            let lineHeight;
            let fontWeight;
            if (d.variable === _self.props.primaryVariables[timepoint]) {
                lineHeight = _self.props.visMap.primaryHeight;
                fontWeight = 800;
            }
            else {
                lineHeight = _self.props.visMap.secondaryHeight;
                fontWeight = 0;
            }
            const transform = "translate(0," + pos + ")";
            const iconScale = (_self.props.visMap.secondaryHeight - _self.props.visMap.gap) / 20;
            const fontSize = 10;
            pos = pos + lineHeight + _self.props.visMap.gap;
            const yIcons = -(iconScale * 24 - lineHeight) / 2;
            return <g key={d.variable} className={"clickable"} transform={transform}>
                <text key={"promote" + d.variable} fontWeight={fontWeight}
                      transform={"translate(0," + (lineHeight / 2 + 0.5 * fontSize) + ")"}
                      fontSize={fontSize}
                      onClick={(e) => _self.promote(timepoint, d.variable, e)}>{d.variable}</text>
                <rect key={"text1" + d.variable} onClick={() => function1(timepoint, d.variable)}
                      transform={"translate(" + (_self.props.svgWidth - iconScale * 24) + "," + yIcons + ")scale(" + iconScale + ")"}
                      width={iconScale * 24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
                <path key={"rect1" + d.variable} onClick={() => function1(timepoint, d.variable)}
                      transform={"translate(" + (_self.props.svgWidth - iconScale * 24) + "," + yIcons + ")scale(" + iconScale + ")"}
                      fill="gray"
                      d={icon1}/>
                <rect key={"text2" + d.variable} onClick={() => function2(timepoint, d.variable)}
                      transform={"translate(" + (_self.props.svgWidth - iconScale * 48) + "," + yIcons + ")scale(" + iconScale + ")"}
                      width={24} height={24}
                      fill="none" pointerEvents="visible"/>
                <path key={"rect2" + d.variable} onClick={() => function2(timepoint, d.variable)}
                      transform={"translate(" + (_self.props.svgWidth - iconScale * 48) + "," + yIcons + ")scale(" + iconScale + ")"}
                      fill="gray"
                      d={icon2}/>
            </g>
        });

    }

    render() {
        let headers = [];
        const _self = this;
        const sort = "M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z";
        const group = "M12.5,19.5V3.47H14.53V19.5H12.5M9.5,19.5V3.47H11.53V19.5H9.5M4.5,7.5L8.53,11.5L4.5,15.47V12.47H1.5V10.5H4.5V7.5M19.5,15.47L15.5,11.5L19.5,7.5V10.5H22.5V12.47H19.5V15.47Z";
        const ungroup = "M9,11H15V8L19,12L15,16V13H9V16L5,12L9,8V11M2,20V4H4V20H2M20,20V4H22V20H20Z";

        this.props.groupOrder.forEach(function (d, i) {
            let transform = "translate(0," + _self.props.posY[i] + ")";
            if (!d.isGrouped) {
                headers.push(<g key={"Operator" + i}
                                transform={transform}>{_self.getRowOperator(i, sort, group, _self.sort, _self.group)}</g>)
            }
            else {
                headers.push(<g key={"Operator" + i}
                                transform={transform}>{_self.getRowOperator(i, sort, ungroup, _self.sort, _self.unGroup)}</g>)
            }
        });
        let transform = "translate(0," + 20 + ")";
        return (
            <g transform={transform}>
                {headers}
            </g>
        )
    }
});
export default RowOperators;
