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
    }

    sort(timepoint, variable) {
        this.props.store.setPrimaryVariable(timepoint, variable);
        if (this.props.isGrouped[timepoint]) {
            this.props.store.groupTimepoint(timepoint, variable);
            this.props.store.sortGroups(timepoint, -1)
        }
        else {
            this.props.store.sortHeatmapTimepoint(timepoint, variable);
        }
    }

    unGroup(timepoint, variable) {
        this.props.store.unGroupTimepoint(timepoint, variable);
    }

    promote(timepoint, variable) {
        this.props.store.setPrimaryVariable(timepoint, variable);
        if (this.props.isGrouped[timepoint]) {
            this.props.store.groupTimepoint(timepoint, variable)
        }
    }
    getRowOperator(timepoint,icon1,icon2,function1,function2){
      const _self = this;
        let pos = 0;
        return this.props.currentVariables.map(function (d, i) {
            let lineHeight;
            let fontWeight;
            if (d === _self.props.primaryVariables[timepoint]) {
                lineHeight = _self.props.primaryHeight;
                fontWeight = 800;
            }
            else {
                lineHeight = _self.props.secondaryHeight;
                fontWeight = 0;
            }
            const transform = "translate(0," + pos + ")";
            const iconScale=(_self.props.secondaryHeight-_self.props.gap)/20;
            const fontSize=10;
            pos = pos + lineHeight + _self.props.gap;
            const yIcons = -(iconScale*24 - lineHeight) / 2;
            return <g className={"clickable"} transform={transform}>
                <text fontWeight={fontWeight} transform={"translate(0," + (lineHeight / 2 + 0.5*fontSize) + ")"}
                      fontSize={fontSize}
                      onClick={(e) => _self.promote(timepoint, d, e)}>{d}</text>
                <rect onClick={() => function1(timepoint, d)}
                      transform={"translate(" + (_self.props.svgWidth - iconScale*24) + "," + yIcons + ")scale("+iconScale+")"} width={iconScale*24} height={24}
                      fill="none"
                      pointerEvents="visible"/>
                <path onClick={() => function1(timepoint, d)}
                      transform={"translate(" + (_self.props.svgWidth - iconScale*24) + "," + yIcons + ")scale("+iconScale+")"} fill="gray"
                      d={icon1}/>
                <rect onClick={() => function2(timepoint, d)}
                      transform={"translate(" + (_self.props.svgWidth - iconScale*48) + "," + yIcons + ")scale("+iconScale+")"} width={24} height={24}
                      fill="none" pointerEvents="visible"/>
                <path onClick={() => function2(timepoint, d)}
                      transform={"translate(" + (_self.props.svgWidth - iconScale*48) + "," + yIcons + ")scale("+iconScale+")"} fill="gray"
                      d={icon2}/>
            </g>
        });

    }

    render() {
        let headers = [];
        const _self = this;
        const sort="M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z";
        const group="M12.5,19.5V3.47H14.53V19.5H12.5M9.5,19.5V3.47H11.53V19.5H9.5M4.5,7.5L8.53,11.5L4.5,15.47V12.47H1.5V10.5H4.5V7.5M19.5,15.47L15.5,11.5L19.5,7.5V10.5H22.5V12.47H19.5V15.47Z";
        const ungroup="M9,11H15V8L19,12L15,16V13H9V16L5,12L9,8V11M2,20V4H4V20H2M20,20V4H22V20H20Z";

        this.props.isGrouped.forEach(function (d, i) {
            let transform = "translate(0," + _self.props.posY[i] + ")";
            if (!d) {
                headers.push(<g transform={transform}>{_self.getRowOperator(i,sort,group,_self.sort,_self.group)}</g>)
            }
            else {
                headers.push(<g transform={transform}>{_self.getRowOperator(i,sort,ungroup,_self.sort,_self.unGroup)}</g>)
            }
        });
        return (
            headers
        )
    }
});
export default RowOperators;
