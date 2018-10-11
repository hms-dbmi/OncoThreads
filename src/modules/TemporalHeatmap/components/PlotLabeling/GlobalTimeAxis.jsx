import React from "react";
import {observer} from "mobx-react";
import * as d3 from "d3";
//import ReactDOM from 'react-dom'

/*
 * Patient axis pointing to the right
 */
const GlobalTimeAxis = observer(class GlobalTimeAxis extends React.Component {

   
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
        return  yAxis; //d3.axisLeft().scale(y);
    }

    
    renderAxis() {

            var timeV=this.props.maxTimeInDays;
    
            if(this.props.store.rootStore.timeVar==="30"){
                timeV=this.props.maxTimeInDays/30;
            }
            else if(this.props.store.rootStore.timeVar==="365"){
                timeV=this.props.maxTimeInDays/365;
            }
            const y = d3.scaleLinear().domain([0, timeV]).range([0, this.props.height - 35]).nice();
        
           
            const yAxis = d3.axisLeft().scale(y);
                //.scale(y);
                //.ticks(5);
                
            //const node = ReactDOM.findDOMNode(this);
            //d3.select(node).call(yAxis);
            d3.select(".axisGlobal").call(yAxis);

            d3.selectAll(".axisLabel").remove();

            
            d3.select(".axisGlobal")
            .append("text")
            .attr("class", "axisLabel")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -1*this.props.height/4)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style("font-family", "times")
            .style("font-size", "12px")
            .style("stroke-width", 0.5)
            .style("stroke", "black")
            .style("fill", "black")
            .text(this.props.timeValue);
            //.text(this.props.store.rootStore.timeValue);


            d3.select(".axisGlobal2").call(yAxis);

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

            //console.log(yval);

           /* var yval = []
            d3.selectAll(vl).each(function(d) {
            yval.push(d);
            });*/

           


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

            });

    
    
    }

    render() {

        return (
            <div>
                <svg height={this.props.height} width={this.props.width}>
                    <g className="axisGlobal" transform="translate(50, 25)">
                    </g>

                    <g className="axisGlobal2" transform="translate(50, 25)">
                    </g>
                </svg>

                
            </div>
        );
    }
});
export default GlobalTimeAxis;
