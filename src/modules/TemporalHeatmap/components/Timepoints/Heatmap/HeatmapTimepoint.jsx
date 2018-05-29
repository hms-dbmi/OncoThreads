import React from 'react';
import {observer} from 'mobx-react';
import HeatmapRow from './HeatmapRow';

/*
creates a heatmap timepoint
 */
const HeatmapTimepoint = observer(class HeatmapTimepoint extends React.Component {


    getTimepoint() {
        const _self = this;
        let rows = [];
        let previousYposition = 0;
        this.props.timepoint.forEach(function (row, i) {
            //get the correct color scale depending on the type of the variable (STRING, continous or binary)
            let color = _self.props.visMap.getColorScale(row.variable,_self.props.currentVariables[i].datatype);
            const transform = "translate(0," + previousYposition + ")";
            if (row.variable === _self.props.primaryVariable.id) {
                rows.push(<g key={row.variable} transform={transform}>
                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.visMap.primaryHeight}
                                opacity={1}
                                color={color}
                                ht={_self.props.ht}
                    x={(_self.props.visMap.sampleRectWidth-_self.props.rectWidth)/2}/>;
                </g>);
                previousYposition += _self.props.visMap.primaryHeight + _self.props.visMap.gap;
            }
            else {
                rows.push(<g key={row.variable} transform={transform}>
                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.visMap.secondaryHeight}
                                opacity={0.5}
                                color={color}
                                ht={_self.props.ht}
                                x={(_self.props.visMap.sampleRectWidth-_self.props.rectWidth)/2}/>;
                </g>);
                previousYposition += _self.props.visMap.secondaryHeight + _self.props.visMap.gap;
            }
        });
        return (rows)
    }


    getGlobalTimepoint() {
        const _self = this;
        let rows = [];
        let previousYposition=0;

        let count=0;

        let globalIndex = 0;

        let ypi=_self.props.ypi;


        //let color2 =  d3.scaleOrdinal(d3.schemeCategory10); ;
        this.props.timepoint.forEach(function (row, i) {
            //get the correct color scale depending on the type of the variable (STRING, continous or binary)
            //let color = _self.props.visMap.getColorScale("Timeline",_self.props.currentVariables[i].type);
            //let color = x => { return "#ffd92f" };

            let color = _self.props.visMap.getColorScale(row.variable,_self.props.currentVariables[i].datatype);

            //if(_self.props.store.rootStore.transitionOn)  color = x => { return "#ffd92f" };

            //const transform = "translate(0," + previousYposition + ")";



            if (row.variable === _self.props.primaryVariable.id) {
              rows.push(<g key={row.variable + i + globalIndex} >

                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.visMap.primaryHeight}
                                opacity={1}
                                color={color}
                                x={(_self.props.visMap.primaryHeight-_self.props.rectWidth)/2}
                                ypi={_self.props.ypi}
                                ht={_self.props.ht}/>;

                </g>);

                //previousYposition += _self.props.visMap.primaryHeight + _self.props.visMap.gap;

                //previousYpositions = _self.props.ypi;

                //_self.drawLines4(rows);
                count++;

            }
            else {


              if(count===1){
                ypi=ypi.map(y=>y+_self.props.rectWidth);
              }
              else{
                ypi=ypi.map(y=>y+_self.props.rectWidth/2);
              }

              rows.push(<g key={row.variable  + i + globalIndex} >

                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.visMap.secondaryHeight}
                                opacity={0.5}
                                color={color}
                                x={(_self.props.visMap.primaryHeight-_self.props.rectWidth)/2}
                                ypi={ypi}
                                ht={_self.props.ht}/>;
                </g>);

                previousYposition = previousYposition + _self.props.visMap.secondaryHeight + _self.props.visMap.gap;

                count++;

                //_self.drawLines4(rows);
            }

            globalIndex++;
        });
        return (rows)
    }



    getGlobalTimepointWithTransition() {
        const _self = this;
        let rows = [];
        let previousYposition=0;

        let count=0;

        let ypi=_self.props.ypi;

        let globalIndex = 0;


        //let color2 =  d3.scaleOrdinal(d3.schemeCategory10); ;
        this.props.timepoint.forEach(function (row, i) {
            //get the correct color scale depending on the type of the variable (STRING, continous or binary)
            //let color = _self.props.visMap.getColorScale("Timeline",_self.props.currentVariables[i].type);
            //let color = x => { return "#ffd92f" };

            let color = _self.props.visMap.getColorScale(row.variable,_self.props.currentVariables[i].datatype);

            //if(row.variable,_self.props.currentVariables[i].type==="binary"){
            if(_self.props.currentVariables[i].datatype==="binary"){
                color = x => { return "#ffd92f" };
            }
            //if(_self.props.store.rootStore.transitionOn)  color = x => { return "#ffd92f" };

            //const transform = "translate(0," + previousYposition + ")";



            if (row.variable === _self.props.primaryVariable.id ) {
              rows.push(<g key={row.variable + i + globalIndex} >

                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.visMap.primaryHeight}
                                opacity={1}
                                color={color}
                                eventStartEnd={_self.props.eventStartEnd}
                                x={(_self.props.visMap.primaryHeight-_self.props.rectWidth)/2}
                                ypi={_self.props.ypi}
                                ht={_self.props.ht}/>;

                </g>);

                //previousYposition += _self.props.visMap.primaryHeight + _self.props.visMap.gap;

                //previousYpositions = _self.props.ypi;

                //_self.drawLines4(rows);
                count++;


            }
            else {


              if(count===1){
                ypi=ypi.map(y=>y+_self.props.rectWidth);
              }
              else{
                ypi=ypi.map(y=>y+_self.props.rectWidth/2);
              }

              rows.push(<g key={row.variable + i+ globalIndex} >

                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.visMap.secondaryHeight}
                                opacity={0.5}
                                color={color}

                                x={(_self.props.visMap.primaryHeight-_self.props.rectWidth)/2}
                                ypi={ypi}
                                ht={_self.props.ht}/>;
                </g>);
                previousYposition = previousYposition + _self.props.visMap.secondaryHeight + _self.props.visMap.gap;

                count++;



                //_self.drawLines4(rows);
            }

            globalIndex++;
        });
        return (rows)
    }




    render() {
       // return (
         //   this.getTimepoint()
        //)
        //



        /*if(this.props.store.rootStore.globalTime || this.props.store.rootStore.transitionOn) {
            return (
                this.getGlobalTimepoint()
            )
        } else {
            return (
                this.getTimepoint()
            )

        }
    */

        if(this.props.store.rootStore.globalTime && !this.props.store.rootStore.transitionOn) {
            return (
                this.getGlobalTimepoint()
            )
        }

        else if(this.props.store.rootStore.globalTime && this.props.store.rootStore.transitionOn) {
        //else if(this.props.store.rootStore.transitionOn) {
            return (
                this.getGlobalTimepointWithTransition()
            )
        }
        else {
            return (
                this.getTimepoint()
            )

        }



       //


    }
});
export default HeatmapTimepoint;