import React from 'react';
import {observer} from 'mobx-react';
import BinningModal from './BinningModal';
import * as d3 from 'd3';


const ContinuousBinner = observer(class ContinuousBinner extends React.Component {
    constructor(props) {
        super(props);
        this.bins=[]
        this.binNames=["Bin 1", "Bin 2"]
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
        this.bins=bins;
    }

    handleNumberOfBinsChange(number) {
        if (number > this.binNames.length) {
            this.binNames.push("Bin " + number);
        }
        else {
            this.binNames.pop();
        }
    }

    close() {
            this.binNames= ["Bin 1", "Bin 2"];
        this.props.closeModal();
    }


    /**
     * applies binning to data and color scales
     */
    handleApply() {
        this.props.store.binContinuous(this.props.variable, this.bins, this.binNames, this.props.type);
        this.props.visMap.setBinnedColorScale(this.props.variable, this.binNames, this.bins);
        this.props.followUpFunction(this.props.timepointIndex, this.props.variable);
        this.props.closeModal();
    }

    /**
     * handles the name change of the bins
     * @param e
     * @param index
     */
    handleBinNameChange(e, index) {
        this.binNames[index] = e.target.value;
    }

    render() {
        const data=this.props.store.getAllValues(this.props.variable)
        this.bins=[d3.min(data) - 1, Math.round((d3.max(data) + d3.min(data)) / 2), d3.max(data)]
        return (
            <BinningModal data={data} binNames={this.binNames} bins={this.bins} variable={this.props.variable} handleBinChange={this.handleBinChange}
                                         handleNumberOfBinsChange={this.handleNumberOfBinsChange} handleBinNameChange={this.handleBinNameChange}
                                        close={this.close} handleApply={this.handleApply} modalIsOpen={this.props.modalIsOpen}/>
        )
    }
});
export default ContinuousBinner;