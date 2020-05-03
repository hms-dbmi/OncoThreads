import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes} from 'mobx-react';
import { extendObservable } from 'mobx';
import PropTypes from 'prop-types';
import {PCA} from 'ml-pca';

/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */
const style={
    height:"500px",
    width:"95%",
    margin:"2%",
    boxShadow: "0 1px 6px 0 rgba(32, 33, 36, .28)"
}

const CustomGrouping = observer(class CustomGrouping extends React.Component {
    constructor(props) {
        super(props);
        this.getPoints = this.getPoints.bind(this)
    }

    getPoints(){
        var points = []
        
        let {timepoints,currentVariables, referencedVariables} = this.props
        if (timepoints[0].heatmap.length!=currentVariables.length) return []
        
        // get points,each points is one patient at one timepoint
        timepoints.forEach((timepoint)=>{
            var heatmap = timepoint.heatmap
            
            if(heatmap[0]){
                heatmap[0].data.forEach((_, i)=>{
                    var point = heatmap.map(d=>d.data[i].value=='undefined'?0:d.data[i].value)
                    // console.info(point)
                    points.push(point)
                })
            }              
        })

        
        
        return this.normalizePoints(points, currentVariables, referencedVariables)       
    }

    // convert points to [0,1] range.
    // @param: points: string||number[][], 
    // @param: currentVariable: [variableName:string][]
    // @param: referencedVariables: {[variableName:string]: {range:[], datatype:"NUMBER"|"STRING"}}
    // return: points: number[][]
    normalizePoints(points, currentVariables, referencedVariables){
        if (points.length==0) return points
        var newPoints = points.map(point=>{
            var newPoint = point.map((value,i)=>{
                let ref = referencedVariables[currentVariables[i]]
                if(ref.datatype==='STRING'){
                    return ref.domain.indexOf(value)/ref.domain.length
                }else if(ref.datatype=="NUMBER"){
                    return (value-ref.domain[0])/(ref.domain[1]-ref.domain[0])
                }
            })
            return newPoint
        })
        
        var pca = new PCA(newPoints)
        console.info(newPoints)
        if (points[0].length>2){
            newPoints = pca.predict(newPoints,  {nComponents: 2})
            console.info('pca points', newPoints)
        }
        return newPoints

    }

    drawVIS(points){
        
    }

    // componentDidMount(){
    //     this.getPoints()
    // }
    // componentDidUpdate(){
    //     this.getPoints()
    // }

    render() {
        let points = this.getPoints()
        return (
            <div className="container" style={{width:"100%"}}>
                <div className="customGrouping" style={style}>
                    {points.length}
                    {this.props.timepoints.length}
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
