import React from 'react';
import {observer} from 'mobx-react';
import BinningModal from './BinningModal';
import * as d3 from 'd3';
import uuidv4 from 'uuid/v4';


const ContinuousBinner = observer(class ContinuousBinner extends React.Component {
    constructor(props) {
        super(props);
        this.data=props.store.getAllValues(props.variable);
        this.state={
            bins:[d3.min(this.data) - 1, Math.round((d3.max(this.data) + d3.min(this.data)) / 2), d3.max(this.data)],
            binNames:["Bin 1", "Bin 2"]
        };
        this.handleBinChange = this.handleBinChange.bind(this);
        this.handleNumberOfBinsChange = this.handleNumberOfBinsChange.bind(this);
        this.handleBinNameChange = this.handleBinNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * handles bin change (sliders are moved)
     * @param bins
     */
    handleBinChange(bins) {
        this.setState({
            bins:bins
        })
    }

    handleNumberOfBinsChange(number) {
        let binNames = this.state.binNames.slice();
        if (number > this.state.binNames.length) {
            binNames.push("Bin " + number);
        }
        else {
            binNames.pop();
        }
        this.setState({binNames: binNames})
    }

    close() {
        this.props.closeModal();
        this.setState({
            bins:[],
            binNames:["Bin 1", "Bin 2"]
        });
    }


    /**
     * applies binning to data and color scales
     */
    handleApply() {
        const newId=uuidv4();
        let saveToHistory=false;
        if(this.props.followUpFunction===null){
            saveToHistory=true;
        }
        this.props.store.binContinuous(newId,this.props.variable, this.state.bins, this.state.binNames, this.props.type,saveToHistory);
        this.props.visMap.setBinnedColorScale(newId,this.props.variable, this.state.binNames, this.state.bins);
        if(!saveToHistory) {
            this.props.followUpFunction(this.props.timepointIndex, newId);
        }
        this.close();
    }

    /**
     * handles the name change of the bins
     * @param e
     * @param index
     */
    handleBinNameChange(e, index) {
        let binNames = this.state.binNames.slice();
        binNames[index] = e.target.value;
        this.setState({binNames: binNames})
    }

    render() {
        let variableName=this.props.store.variableStore[this.props.type].getById(this.props.variable).name;
        return (
            <BinningModal data={this.data} binNames={this.state.binNames} bins={this.state.bins} variableName={variableName} variable={this.props.variable} handleBinChange={this.handleBinChange}
                                         handleNumberOfBinsChange={this.handleNumberOfBinsChange} handleBinNameChange={this.handleBinNameChange}
                                        close={this.close} handleApply={this.handleApply} modalIsOpen={this.props.modalIsOpen}/>
        )
    }
});
export default ContinuousBinner;