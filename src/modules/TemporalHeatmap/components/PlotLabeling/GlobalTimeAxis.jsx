import React from "react";
import {observer,inject} from "mobx-react";
import * as d3 from "d3";
//import ReactDOM from 'react-dom'

/*
 * Axis for showing the time scale in the global timeline
 * TODO: Make more react like (see Axis in VariableModals/ModifySingleVariables/Binner)
 */
const GlobalTimeAxis = inject("rootStore")(observer(class GlobalTimeAxis extends React.Component {


    //render() {


    /* return (
         <div>



         <svg width={this.props.width / 3} height={this.props.height}>
             <defs>
                 <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                         markerUnits="strokeWidth">
                     <path d="M0,0 L0,6 L9,3 z" fill="darkgray"/>
                 </marker>
             </defs>


             <g>

                 <text textAnchor="end"
                       x="37"

                       y={this.props.height / 2 - 140}
                       fontSize="10px"
                 >
                     <tspan x="37" dy="1em">Time</tspan>

                     <tspan x="39" dy="1em">({this.props.store.rootStore.timeValue})</tspan>




                 </text>




                 <line x1="43" y1="25" x2="43" y2={this.props.height - 20} stroke="darkgray"
                       markerEnd="url(#arrow)" strokeWidth="2"/>

                 <text textAnchor="end" x="32" y="30" fontSize="10px">0</text>

                 <text textAnchor="end" x="32" y={(this.props.height - 20) / 4.0}
                       fontSize="10px">{Math.round((this.props.maxTimeInDays / 4.0) / (this.props.store.rootStore.timeVar) *100  )/100.0}</text>

                 <text textAnchor="end" x="32" y={(this.props.height - 20) * 2 / 4.0}
                       fontSize="10px">{Math.round((this.props.maxTimeInDays * 2 / 4.0)/ (this.props.store.rootStore.timeVar) *100)/100.0}</text>

                 <text textAnchor="end" x="32" y={(this.props.height - 20) * 3 / 4.0}
                       fontSize="10px">{Math.round((this.props.maxTimeInDays * 3 / 4.0)/(this.props.store.rootStore.timeVar) *100)/100.0}</text>

                 <text textAnchor="end" x="32" y={this.props.height - 20}
                       fontSize="10px">{Math.round(this.props.maxTimeInDays/ (this.props.store.rootStore.timeVar) *100 )/100.0}</text>

             </g>

         </svg>


         </div>
     );*/

    // return null;
    // }


    componentDidUpdate() {
        this.renderAxis();
    }

    componentDidMount() {
        this.renderAxis()
    }

    make_y_gridlines(yAxis) {
        return yAxis; //d3.axisLeft().scale(y);
    }


    renderAxis() {

        var timeV = this.props.rootStore.maxTimeInDays / this.props.rootStore.timeVar;
        const y = d3.scaleLinear().domain([0, timeV]).range([0, this.props.rootStore.visStore.svgHeight - 35]).nice();


        const yAxis = d3.axisLeft().scale(y);
        //.scale(y);
        //.ticks(5);

        //const node = ReactDOM.findDOMNode(this);
        //d3.select(node).call(yAxis);
        d3.select(".axisGlobal").call(yAxis);

        d3.selectAll(".axisLabel").remove();

        let text_var=this.props.rootStore.timeValue;

        if(text_var==='days'){
            text_var='Days';
        }
        else if(text_var==='months'){
            text_var='Months';
        }
        else if(text_var==='years'){
            text_var='Years';
        }

        d3.select(".axisGlobal")
            .append("text")
            .attr("class", "axisLabel")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -1 * this.props.rootStore.visStore.svgHeight / 4)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style("font-family", "times")
            .style("font-size", "12px")
            .style("stroke-width", 0.5)
            .style("stroke", "black")
            .style("fill", "black")
            .text(text_var);
        d3.select(".axisGlobal")
            .append("text")
            .attr("class", "fa")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -1 * this.props.rootStore.visStore.svgHeight / 4 + 20)
            .attr("dy", "1em")
            //.style("font-family", "FontAwesome")
            .style("font-size", "9px")
            .style("text-anchor", "end")
            .style("stroke-width", 1)
            .style("stroke", "black")
            .text("\uf013");
        //.text(this.props.store.rootStore.timeValue);


        /*d3.select(".axisGlobal")
        .append("image")
      .attr("xlink:href", "https://img.icons8.com/small/16/000000/button2.png")
      .attr("y", -40)
            .attr("x", -1 * this.props.rootStore.visStore.svgHeight / 4)
            .attr("dy", ".71em")
      .attr("width", 16)
      .attr("height", 16);*/
        /* d3.select(".axisGlobal2").call(yAxis);

         d3.selectAll(".axisLabel2").remove();
         d3.select(".axisGlobal2").select(".grid").remove();


         d3.select(".axisGlobal2")
         .append("g")
         .attr("class", "grid")
         .call(//this.make_y_gridlines(yAxis)
          yAxis
         .tickSize(-this.props.width)
         .tickFormat("")
         )
         .style("stroke-width", 0)
         .style("stroke", "#f00")
         .style("opacity", 0.3)

         //.style("fill", "blue")
         d3.select(".axisGlobal2").select(".intBands").remove();

         var rects =  d3.select(".axisGlobal2")
                     .append('g')
                     .attr('class', 'intBands')


         var yval=yAxis.scale().ticks(yAxis.ticks()[0]);//[0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];

         yval.splice(-1,1);






         var ht=(this.props.height-35)/yval.length, wd=this.props.width;

         //d3.selectAll('g').selectAll('intBands').remove();


         rects.selectAll('rect').data(yval).enter().append('rect')
         .attr('x', 0).attr('y', function(d) {
             return y(d)
         }).attr('height', ht).attr('width', wd)
             //.style("fill", "#ADD8E6")
             .style("fill", "#C2DFFF")
             .style('fill-opacity', function(d, i) {
             //if (i == 0) {
             //return 0;
             //}

             if (i % 2 === 0) {
                 return 0.3;
             }
             else {
                 return 0;
             }

             //return 0.5;

         }); */


    }

    render() {
        return (
            <div>
                <svg height={this.props.rootStore.visStore.svgHeight} width={this.props.width}>
                    <g className="axisGlobal"
                       transform={"translate(50," + this.props.rootStore.visStore.timelineRectSize / 2 + ")"}>
                    </g>
                </svg>
            </div>
        );
    }
}));
export default GlobalTimeAxis;
