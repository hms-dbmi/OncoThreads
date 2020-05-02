import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import PropTypes from 'prop-types';

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
        
        this.props.timepoints.forEach((timepoint)=>{
            var heatmap = timepoint.heatmap
            if(heatmap[0]){
                heatmap[0].data.forEach((_, i)=>{
                    var point = heatmap.map(d=>d.data[i].value)
                    console.info(point)
                    points.push(point)
                })
            }          
        })
    }

    componentDidMount(){
        this.getPoints()
    }
    componentDidUpdate(){
        this.getPoints()
    }

    render() {
        
        return (
            <div className="container" style={{width:"100%"}}>
                <div className="customGrouping" style={style}>
                    {this.props.timepoints.length}
                </div>
            </div>
        );
    }
})


CustomGrouping.propTypes = {
    timepoints: PropTypes.arrayOf(PropTypes.object).isRequired,
    // timepoints: MobxPropTypes.observableArray.isRequired,
};

export default CustomGrouping;
