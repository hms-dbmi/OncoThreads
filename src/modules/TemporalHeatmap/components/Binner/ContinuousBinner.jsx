import React from 'react';
import {observer} from 'mobx-react';
import BinningModal from './BinningModal';
import * as d3 from 'd3';


const ContinuousBinner = observer(class ContinuousBinner extends React.Component {
    constructor(props) {
        super(props);
        this.bins=[];
        this.state={
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
        this.bins=bins;
    }

    handleNumberOfBinsChange(number) {
        let binNames=this.state.binNames.slice();
        if (number > this.state.binNames.length) {
            binNames.push("Bin " + number);
        }
        else {
            binNames.pop();
        }
        this.setState({binNames:binNames})
    }

    close() {
        this.props.closeModal();
        this.bins=[];
        this.setState({binNames:["Bin 1", "Bin 2"]});
    }


    /**
     * applies binning to data and color scales
     */
    handleApply() {
        this.props.store.binContinuous(this.props.variable, this.bins, this.state.binNames, this.props.type);
        this.props.visMap.setBinnedColorScale(this.props.variable, this.state.binNames, this.bins);
        this.props.followUpFunction(this.props.timepointIndex, this.props.variable);
        this.close();
    }

    /**
     * handles the name change of the bins
     * @param e
     * @param index
     */
    handleBinNameChange(e, index) {
        let binNames=this.state.binNames.slice();
        binNames[index] = e.target.value;
        this.setState({binNames:binNames})
    }

    render() {
        const data=this.props.store.getAllValues(this.props.variable);
        this.bins=[d3.min(data) - 1, Math.round((d3.max(data) + d3.min(data)) / 2), d3.max(data)];
        return (
            <BinningModal data={data} binNames={this.state.binNames} bins={this.bins} variable={this.props.variable} handleBinChange={this.handleBinChange}
                                         handleNumberOfBinsChange={this.handleNumberOfBinsChange} handleBinNameChange={this.handleBinNameChange}
                                        close={this.close} handleApply={this.handleApply} modalIsOpen={this.props.modalIsOpen}/>
        )
    }
});
export default ContinuousBinner;