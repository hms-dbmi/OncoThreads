import React from 'react';
import {observer} from 'mobx-react';
import ReactMixins from "../../../utils/ReactMixins.js";
import * as d3 from "d3";

const StackedBarChart = observer(class StackedBarChart extends React.Component {
    constructor() {
        super();
        this.state = {
            timeRange: 90
        };
        ReactMixins.call(this);
    }

    componentDidUpdate() {
        d3.select(this.refs.anchor2).selectAll("g").remove();
        this.doVis(this.props.width, this.props.height, this.props.singlestudydata, this.props.patientdata, this.props.clinicalData);
    }

    updateTimeRange(value) {
        this.setState({
            timeRange: value
        });
    }

    doVis(propWidth, propHeight, patientsList, a, clinicalData) {
        const r = this.aggregatedata(clinicalData);
        var margin = {top: 10, right: 300, bottom: 40, left: 40};
        var width = propWidth-margin.left-margin.right; //+svg.attr("width") - margin.this.left - margin.this.right,
        var height = propHeight-margin.top-margin.bottom; //+svg.attr("height") - margin.this.top - margin.this.bottom;
        var xbar = d3.scaleBand()
            .range([0, width])
            .padding(0.3);
        var ybar = d3.scaleLinear()
            .range([height, 0]);

        const svg2 = d3.select(this.refs.anchor2);
        var g2 = svg2.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        let data={};
        let demographics={};
    
        a.forEach(function(s) {
            if(!data[s.patientId + s.startNumberOfDaysSinceDiagnosis + s.eventType]) {
                if(s.eventType!='TREATMENT') {
                    if(s.eventType!='STATUS') {
                        data[s.patientId + s.startNumberOfDaysSinceDiagnosis + s.eventType] = {
                            patientId: s.patientId,
                            days: s.startNumberOfDaysSinceDiagnosis,
                            days2: s.startNumberOfDaysSinceDiagnosis,
                            eventType: s.eventType,
                            Age: r[s.patientId].AGE,
                            Sex: r[s.patientId].SEX,
                            Status: r[s.patientId].OS_STATUS,
                            SurvivalMonths: r[s.patientId].OS_MONTHS
                        }
                    } else {
                        data[s.patientId + s.startNumberOfDaysSinceDiagnosis + s.eventType] = {
                            patientId: s.patientId,
                            days: s.startNumberOfDaysSinceDiagnosis,
                            days2: s.startNumberOfDaysSinceDiagnosis,
                            eventType: s.attributes[0].value,
                            Age: r[s.patientId].AGE,
                            Sex: r[s.patientId].SEX,
                            Status: r[s.patientId].OS_STATUS,
                            SurvivalMonths: r[s.patientId].OS_MONTHS
                        }      
                    }      
                } else {
                    data[s.patientId + s.startNumberOfDaysSinceDiagnosis + s.eventType] = {
                        patientId: s.patientId,
                        days: s.startNumberOfDaysSinceDiagnosis,
                        days2: s.endNumberOfDaysSinceDiagnosis,
                        eventType: s.eventType,
                        Age: r[s.patientId].AGE,
                        Sex: r[s.patientId].SEX,
                        Status: r[s.patientId].OS_STATUS,
                        SurvivalMonths: r[s.patientId].OS_MONTHS
                    }   
                }
            }

            //end day - possibly death

            if(!data[s.patientId + r[s.patientId].OS_MONTHS * 30 + "endofdata"]) {
                data[s.patientId + r[s.patientId].OS_MONTHS * 30 + "endofdata"] = {
                    patientId: s.patientId,
                    days: r[s.patientId].OS_MONTHS * 30,
                    days2: r[s.patientId].OS_MONTHS * 30,
                    eventType: r[s.patientId].OS_STATUS,
                    Age: r[s.patientId].AGE,
                    Sex: r[s.patientId].SEX,
                    Status: r[s.patientId].OS_STATUS,
                    SurvivalMonths: r[s.patientId].OS_MONTHS
                }
            }
                    
        });
        
        data=Object.values(data);
    
    
        a.forEach(function(s) {
            if(!demographics[s.patientId]) {
                demographics[s.patientId]={
                    patientId: s.patientId,
                    Sex: r[s.patientId].SEX,            
                    Age: r[s.patientId].AGE,
                    Status: r[s.patientId].OS_STATUS
                }
            }
        });

    
        let aggdata={};

        patientsList.forEach(function(k) {
            var  pi=k.patientId,                
            xd2= data; //.filter(s=>s.Status=="DECEASED");
            var xd=xd2.filter(s=>s.patientId==pi);

            if(xd.length) {
                var m=xd[0].SurvivalMonths * 30;
        
                if(!aggdata[pi]) {
                    aggdata[pi] = {
                        patientId: pi,
                        daysSurvived: m,
                        Sex: xd[0].Sex                
                    }
                }                  
            }
        });

        aggdata=Object.values(aggdata);
        var c=aggdata.map(s=>s.daysSurvived);
        var gen=aggdata.map(s=>s.Sex);
        var cm=Math.max(...c);
        var cmf=Math.ceil(cm/this.state.timeRange);

        let bin={};

        for(let i=1; i<=cmf; i++) {
            var count=0, count_m=0, count_f=0;
        
            for(let j=0; j<c.length; j++) {
                if(c[j]/(i*this.state.timeRange)>=1) {
                    count++;
                    if(gen[j]=="Male") {
                        count_m++;
                    } else {
                        count_f++; 
                    }
                }
            }
    
            if(!bin[i]) {
                bin[i] = {
                    numDays:  i*this.state.timeRange,
                    countP: count,
                    count_m: count_m,
                    count_f: count_f
                }
            }
        }

        bin=Object.values(bin);
        var z = d3.scaleOrdinal()
            .range(["#d8b365", "#5ab4ac"]);

        var keys = ["count_m", "count_f"];

        xbar.domain(bin.map(function(d) { return d.numDays; }));
        ybar.domain([0, d3.max(bin, function(d) { return d.countP; })]).nice();

        var tooltip2 = g2.append('text');

        g2.selectAll(".bar")
            .data(d3.stack().keys(keys)(bin))
            .enter().append("g")
            .attr("fill", function(d) { return z(d.key); })
            .selectAll("rect")
            .data(function(d) { 
                return d; 
            })
            .enter()
                .append("rect")
                .attr("x", function(d) {
                    return xbar(d.data.numDays);
                })
                .attr("y", function(d) { //console.log(d[1]); 
                    return ybar(d[1]);
                })
                .attr("height", function(d) { return ybar(d[0]) - ybar(d[1]); })
                .attr("width", 8)
                .on("mouseover", function(d) {
                    tooltip2.raise();
                    return tooltip2
                        .style("visibility", "visible")
                        .style("z-index", -2)
                        .style("position", "absolute")
                        .text( (-1)*(d[0]-d[1]) );
                })
                .on("mousemove", function(d){
                    return tooltip2
                        .attr("x", xbar(d.data.numDays)+12).attr("y", ybar(d[1])-8)
                        .attr("fill", "black")
                        .attr("dy", "1em");
                })
                .on("mouseout", function(d){
                    return tooltip2.style("visibility", "hidden");
                })


        g2.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xbar))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-0.5em")
            .attr("transform", "rotate(-90)");


        g2.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(ybar).ticks(null, "s"))
            .append("text")
            .attr("x", 2)
            .attr("y", ybar(ybar.ticks().pop()) + 0.5)
            .attr("dy", "0.3em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start")
            .text("# of Patients");


        var legend = g2.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(keys.slice().reverse())
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", width - 19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9.5)
            .attr("dy", "0.25em")
            .text(function(d) { 
                if(d==="count_m") {
                    return "Male";
                } else {
                    return "Female";
                }
            });
    }

    aggregatedata(a) {
        var newCols = {};
        a.forEach(s => {
            if(!newCols[s.patientId]) {
                newCols[s.patientId] = {
                    patientId: s.patientId
                }
            }            
            var x=s.clinicalAttributeId;
            newCols[s.patientId][x] = s.value;
        });
        return newCols;
    }
  
  

    render() {
/*        const margin = {top: 5, right: 50, bottom: 20, left: 50},
            w = this.state.width - (margin.left + margin.right),
            h = this.props.height - (margin.top + margin.bottom);

        const transform = 'translate(' + margin.left + ',' + margin.top + ')';
        const transformLeft = 'translate(0,0)';
        const transformRight = 'translate(' + (margin.left + 0.5 * w) + ',' + margin.top + ')';
        const xDomain=[0,d3.max(this.props.data[0])];*/

        var selectInterval = ["90 days", "120 days", "180 days"];
        
        return (
            <div className="svg-div">
                <svg width={this.props.width} height={this.props.height}>
                    <g ref="anchor2" />
                </svg>
                <div>
                  <select className="select" onChange={event => {this.updateTimeRange(parseInt(event.target.value))}}>
                    {selectInterval.map(sel => {
                      return (<option key={sel}>{sel}</option>);
                    })}
                  </select>
                </div>
            </div>
        );
    }
});
StackedBarChart.defaultProps = {
    width: 900,
    height: 320,
    timeRange: 90,
    singlestudydata: [],
    patientdata: [],
    clinicalData: []
};
export default StackedBarChart;
