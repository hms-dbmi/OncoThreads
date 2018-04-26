import React from 'react';
import {observer} from 'mobx-react';
import BinSelector from './BinSelector'
import BinNames from './BinNames'
import * as d3 from 'd3';


const ContinuousBinner = observer(class ContinuousBinner extends React.Component {
    constructor(props){
        super(props);
        this.data=props.store.getAllValues(this.props.variable);
        this.handleBinChange=this.handleBinChange.bind(this);
        this.handleNumberOfBinsChange=this.handleNumberOfBinsChange.bind(this);
        this.handleBinNameChange=this.handleBinNameChange.bind(this);
        this.handleCancel=this.handleCancel.bind(this);
        this.handleApply=this.handleApply.bind(this);
        this.state=({
            binNames:["Bin 1","Bin 2"],
            bins:[d3.min(this.data)-1,Math.round((d3.max(this.data)+d3.min(this.data))/2),d3.max(this.data)]
        })
    }

    /**
     * handles bin change (sliders are moved)
     * @param bins
     */
    handleBinChange(bins){
        this.setState({bins:bins});
    }
    handleNumberOfBinsChange(number){
        let binNames=this.state.binNames.slice();
        if(number>binNames.length){
            binNames.push("Bin "+number);
        }
        else{
            binNames.pop();
        }
        this.setState({binNames:binNames});
    }

    /**
     * handles the cancel button
     */
    handleCancel(){
        this.props.close();
    }

    /**
     * applies binning to data and color scales
     */
    handleApply(){
        console.log(this.state.bins,this.state.binNames);
        this.props.store.binContinuous(this.props.variable,this.state.bins,this.state.binNames);
        this.props.visMap.setBinnedColorScale(this.props.variable,this.state.binNames,this.state.bins);
        this.props.followUpFunction(this.props.timepointIndex,this.props.variable);
        this.props.close();
    }

    /**
     * handles the name change of the bins
     * @param e
     * @param index
     */
    handleBinNameChange(e,index){
        let binNames=this.state.binNames.slice();
        binNames[index]=e.target.value;
        this.setState({binNames:binNames});
    }

    render() {
        return (
            <div>
                <h2>Bin {this.props.variable}</h2>
                <br/>
                <BinSelector data={this.data} numBins={this.state.bins} width={450} height={300} handleBinChange={this.handleBinChange} handleNumberOfBinsChange={this.handleNumberOfBinsChange}/>
                <BinNames binNames={this.state.binNames} handleBinNameChange={this.handleBinNameChange}/>
                <button onClick={this.handleCancel}>Cancel</button>
                <button onClick={this.handleApply}>Apply</button>
            </div>
        )
    }
});
export default ContinuousBinner;