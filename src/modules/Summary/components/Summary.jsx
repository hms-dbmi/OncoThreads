import React from "react"

class Summary extends React.Component{
    render(){
        const tpP=this.props.data.numberOfTimepoints/this.props.data.numberOfPatients;
        const spPpT=(this.props.data.numberOfSamples/this.props.data.numberOfPatients)/tpP;
        return(
            <div>
                <p>Number of patients: {this.props.data.numberOfPatients}</p>
                <p>Number of samples: {this.props.data.numberOfSamples}</p>
                <p>Average number of timepoints per patient: {Math.round(tpP*100)/100}</p>
                <p>Average number of samples per patient per timepoint: {Math.round(spPpT*100)/100}</p>
            </div>
        )
    }
}
export default Summary;