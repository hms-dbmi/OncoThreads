import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import { extendObservable } from 'mobx';
import PropTypes from 'prop-types';
import { PCA } from 'ml-pca';
import * as d3 from 'd3';
import lasso from './lasso.js'

import "./CustomGrouping.css"

import PCP from './pcp'
import ColorScales from 'modules/TemporalHeatmap/UtilityClasses/ColorScales'
import GroupInfo from './GroupInfo'

const colors = ColorScales.defaultCategoricalRange
/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */


const CustomGrouping = observer(class CustomGrouping extends React.Component {
    constructor(props) {
        super(props);
        this.getPoints = this.getPoints.bind(this)
        this.addLasso = this.addLasso.bind(this)
        this.ref = React.createRef()
        this.height = window.innerHeight-120
        extendObservable(this, {
            width: window.innerWidth / 2, 
            selected: [] // selected ids string[]
        })
    }


    getPoints(timepoints) {
        var points = []

        // get points,each points is one patient at one timepoint
        timepoints.forEach((timepoint) => {
            var heatmap = timepoint.heatmap

            if (heatmap[0]) {
                heatmap[0].data.forEach((_, i) => {
                    var point = {
                        patient: timepoint.heatmapOrder[i],
                        value: heatmap.map(d => d.data[i].value)
                    }
                    points.push(point)
                })
            }
        })

        // console.info('old points', points)

        
        return points
    }

    // convert points to [0,1] range.
    // @param: points: string||number[][], 
    // @param: currentVariable: [variableName:string][]
    // @param: referencedVariables: {[variableName:string]: {range:[], datatype:"NUMBER"|"STRING"}}
    // return: points: number[][]
    normalizePoints(points, currentVariables, referencedVariables) {
        if (points.length == 0) return points
        var normValues = points.map(point => {
            var normValue = point.value.map((value, i) => {
                let ref = referencedVariables[currentVariables[i]]
                if (value == undefined) {
                    return 0
                } else if (ref.datatype === 'STRING') {
                    return ref.domain.indexOf(value) / ref.domain.length
                } else if (ref.datatype == "NUMBER") {
                    return (value - ref.domain[0]) / (ref.domain[1] - ref.domain[0])
                }
            })
            return normValue
        })

        var pca = new PCA(normValues)
        // console.info(newPoints)
        if (normValues[0].length > 2) {
            // only calculate pca when dimension is larger than 2
            normValues = pca.predict(normValues, { nComponents: 2 }).data
            // console.info('pca points', newPoints)
        }
        

        var normPoints = normValues.map((d, i) => {
            return {
                ...points[i],
                value: d
            }
        })

        return normPoints

    }

    // @params: points: {patient:string, value:[number, number]}[]
    // @params: width:number, height:number, r:number
    // @return: <g></g>
    drawVIS(points, width, height, r = 5, margin = 20) {

        if (points.length == 0) {
            return <g className='points' />
        }
        var xScale = d3.scaleLinear()
            .domain(d3.extent(points.map(d => d.value[0])))
            .range([margin, width - margin])

        var yScale = d3.scaleLinear()
            .domain(d3.extent(points.map(d => d.value[1])))
            .range([margin, height - margin])

        var circles = points.map((point,i) => {
            return <circle
                key={`${point.patient}_${i}`}
                id = {`${point.patient}_${i}`}
                cx={xScale(point.value[0])}
                cy={yScale(point.value[1])}
                r={r}
                fill="white"
                stroke='black'
                strokeWidth='1'
                opacity={0.5}
                className='point'
            />
        })

        this.addLasso(width, height)

        return <g className="points">
            {circles}
        </g>

    }

    addLasso(width, height) {
        // lasso draw
        d3.selectAll('.lasso').remove()
        var svg = d3.select('svg.customGrouping')
        var lasso_area = svg.append("rect")
            .attr('class','lasso area')
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0);
        // console.info(
        //     lasso(),
        //     lasso()()
        //     )
        // Lasso functions to execute while lassoing
        var lasso_start =  () =>{
            mylasso.items()
                .attr("r", 5) // reset size
                .attr('fill', 'white')
        };

        var lasso_draw = ()=> {
            // Style the possible dots
            // mylasso.items().filter(function (d) { return d.possible === true })
            //     .classed({ "not_possible": false, "possible": true });

            // // Style the not possible dot
            // mylasso.items().filter(function (d) { return d.possible === false })
            //     .classed({ "not_possible": true, "possible": false });
        };

        var lasso_end = ()=>{
            // Reset the color of all dots
        
            mylasso.selectedItems()
                .attr('fill', colors[2])
                .attr('r', '7')

            this.selected = mylasso.selectedItems()._groups[0].map(d=>d.attributes.id.value)
            
        };


        var mylasso = lasso()
        mylasso.items(d3.selectAll('circle.point'))
        mylasso.targetArea(lasso_area) // area where the lasso can be started
            .on("start", lasso_start) // lasso start function
            .on("draw", lasso_draw) // lasso draw function
            .on("end", lasso_end); // lasso end function

        
        svg.call(mylasso)


    }

    /**
     * summarize the selected group of points
     * @param {patient:string, value:number[]}[] points 
     * @param string[] selected: ids of points
     * @param string[] currentVariables
     * @return {variableName: domain} group
     */
    getGroup(points, selected, currentVariables){
        let selectedPoints = points.filter((p,i)=>selected.includes(`${p.patient}_${i}`))

        const summarizeDomain = (values)=>{
            if (typeof(values[0])=="number"){
                return [Math.min(...values).toPrecision(4), Math.max(...values).toPrecision(4)]
            }else if (typeof(values[0])=="string"){
                return [... new Set(values)]
            } else return []
        }

        let group = {}
        currentVariables.forEach((name,i)=>{
            group[name] = summarizeDomain( selectedPoints.map(p=>p.value[i]) )
        })

        return group
    }

    componentDidMount() {
        this.width = this.ref.current.getBoundingClientRect().width
    }


    render() {
        
        let {timepoints, currentVariables, referencedVariables} = this.props
        let points = this.getPoints(timepoints)
        let normPoints = this.normalizePoints(points, currentVariables, referencedVariables)
        let { width, height } = this
        let pcpMargin = 25
        let scatterHeight = height*0.35, pcpHeight = height*0.45, infoHeight=height*0.2

        let group = this.getGroup(points, this.selected, currentVariables)
        return (
            <div className="container" style={{ width: "100%" }}>
                <div 
                    className="customGrouping" 
                    style={{ height:`${this.height}px`, width: "100%",marginTop: "5px"}} 
                    ref={this.ref}
                >
                    <svg className='customGrouping' width="100%" height="80%">
                        {this.drawVIS(normPoints, width, scatterHeight)}

                        <g className='PCP' transform={`translate(${pcpMargin}, ${pcpMargin+scatterHeight})`}>
                            <PCP points={points} selected={[]} 
                            currentVariables={currentVariables}
                            referencedVariables={referencedVariables}
                            width={width-2*pcpMargin}
                            height={pcpHeight-2*pcpMargin}
                            selected = {this.selected}
                            />
                        </g>
                    </svg>
                    <GroupInfo groups={[group]} height={infoHeight}/>
                </div>
            </div>
        );
    }
})


CustomGrouping.propTypes = {
    timepoints: PropTypes.arrayOf(PropTypes.object).isRequired,
    currentVariables: PropTypes.arrayOf(PropTypes.string).isRequired,
    referencedVariables: PropTypes.object.isRequired,
    // timepoints: MobxPropTypes.observableArray.isRequired,
};

export default CustomGrouping;
