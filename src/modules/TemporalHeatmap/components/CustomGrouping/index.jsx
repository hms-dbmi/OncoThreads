import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import { extendObservable } from 'mobx';
import PropTypes from 'prop-types';
import { PCA } from 'ml-pca';
import * as d3 from 'd3';
import { lasso } from 'd3-lasso'
import "./CustomGrouping.css"

/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */
const style = {
    height: "500px",
    width: "95%",
    margin: "2%",
    boxShadow: "0 1px 6px 0 rgba(32, 33, 36, .28)"
}

const CustomGrouping = observer(class CustomGrouping extends React.Component {
    constructor(props) {
        super(props);
        this.getPoints = this.getPoints.bind(this)
        this.ref = React.createRef()
        extendObservable(this, {
            width: window.innerWidth / 2
        })
    }


    getPoints() {
        var points = []

        let { timepoints, currentVariables, referencedVariables } = this.props
        if (timepoints[0].heatmap.length != currentVariables.length) return []

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

        var normPoints = this.normalizePoints(points.map(d => d.value), currentVariables, referencedVariables)
        var newPoints = normPoints.map((d, i) => {
            return {
                patient: points[i].patient,
                value: d
            }
        })
        return newPoints
    }

    // convert points to [0,1] range.
    // @param: points: string||number[][], 
    // @param: currentVariable: [variableName:string][]
    // @param: referencedVariables: {[variableName:string]: {range:[], datatype:"NUMBER"|"STRING"}}
    // return: points: number[][]
    normalizePoints(points, currentVariables, referencedVariables) {
        if (points.length == 0) return points
        var newPoints = points.map(point => {
            var newPoint = point.map((value, i) => {
                let ref = referencedVariables[currentVariables[i]]
                if (value == undefined) {
                    return 0
                } else if (ref.datatype === 'STRING') {
                    return ref.domain.indexOf(value) / ref.domain.length
                } else if (ref.datatype == "NUMBER") {
                    return (value - ref.domain[0]) / (ref.domain[1] - ref.domain[0])
                }
            })
            return newPoint
        })

        var pca = new PCA(newPoints)
        // console.info(newPoints)
        if (points[0].length > 2) {
            // only calculate pca when dimension is larger than 2
            newPoints = pca.predict(newPoints, { nComponents: 2 }).data
            // console.info('pca points', newPoints)
        }
        return newPoints

    }

    // @params: points: {patient:string, value:[number, number]}[]
    // @params: width:number, height:number, r:number
    // @return: <g></g>
    drawVIS(points, width, height, r = 5, margin = 10) {
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
        var svg = d3.select('svg.scatterPlot')
        var lasso_area = svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0);
        // console.info(
        //     lasso(),
        //     lasso()()
        //     )
        // Lasso functions to execute while lassoing
        var lasso_start = function () {
            mylasso.items()
                .attr("r", 5) // reset size
                .attr('fill', 'white')
        };

        var lasso_draw = function () {
            // Style the possible dots
            mylasso.items().filter(function (d) { return d.possible === true })
                .classed({ "not_possible": false, "possible": true });

            // Style the not possible dot
            mylasso.items().filter(function (d) { return d.possible === false })
                .classed({ "not_possible": true, "possible": false });
        };

        var lasso_end = function () {
            // Reset the color of all dots
        

            // Style the selected dots
            mylasso.items().filter(function (d) { return d.selected === true })
                .classed({ "not_possible": false, "possible": false })
                .attr('fill', 'blue')
                .attr("r", 7);

            // Reset the style of the not selected dots
            mylasso.items().filter(function (d) { return d.selected === false })
                .classed({ "not_possible": false, "possible": false })
                .attr("r", 5);

        };


        var mylasso = lasso()
        mylasso.items(d3.selectAll('circle.point'))
        mylasso.targetArea(lasso_area) // area where the lasso can be started
            .on("start", lasso_start) // lasso start function
            .on("draw", lasso_draw) // lasso draw function
            .on("end", lasso_end); // lasso end function

        
        svg.call(mylasso)


    }

    componentDidMount() {
        this.width = this.ref.current.getBoundingClientRect().width
    }


    render() {
        let points = this.getPoints()
        let { width } = this
        return (
            <div className="container" style={{ width: "100%" }}>
                <div className="customGrouping" style={style} ref={this.ref}>
                    {points.length}
                    {this.props.timepoints.length}
                    <svg className='scatterPlot' width="100%" height="70%">
                        {this.drawVIS(points, width, 500)}
                    </svg>
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
