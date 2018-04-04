import React from 'react';
import {observer} from 'mobx-react';

const Legend = observer(class Legend extends React.Component {
    constructor() {
        super();
    }
    getLegend(data,primary){
        const _self=this;
        let legend=[];
        let currPos=0;
         data.forEach(function (d,i) {
             let lineheight;
             let opacity=1;
             if(primary===d.variable){
                 lineheight=_self.props.primaryHeight;
             }
             else {
                 lineheight=_self.props.secondaryHeight;
                 opacity=0.5
             }
             let color=_self.props.visMap.getColorScale(d.variable);
             let currKeys=[];
             let legendEntries=[];
             let currX=0;
             const textHeight=10;
             d.data.forEach(function (f,j) {
                 if(!currKeys.includes(f.value)){
                     currKeys.push(f.value);
                     legendEntries.push(<rect opacity={opacity} width={45} height={textHeight+2} x={currX} y={lineheight/2-textHeight/2} fill={color(f.value)}/>);
                     legendEntries.push(<text fontSize={textHeight} x={currX+2} y={lineheight/2+textHeight/2}>{f.value}</text>);
                     currX+=50;
                 }
             });
             const transform="translate(0,"+currPos+")";
             currPos+=lineheight+_self.props.gap;
             legend.push(<g transform={transform}>{legendEntries}</g>)
        });
        return legend
    }

    render() {
        const _self = this;
        const legends=[];
        this.props.primaryVariables.forEach(function (d, i) {
            let transform = "translate(10," + _self.props.posY[i] + ")";
            legends.push(<g transform={transform}>{_self.getLegend(_self.props.timepointData[i].heatmap,d)}</g>);

        });
        return (
            legends
        )
    }
});
export default Legend;
