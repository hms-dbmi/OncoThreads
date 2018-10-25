import React from 'react';
import {observer} from 'mobx-react';
import BinningModal from './BinningModal';
import * as d3 from 'd3';
import uuidv4 from 'uuid/v4';


const ContinuousBinner = observer(class ContinuousBinner extends React.Component {
    constructor(props) {
        super(props);
        this.data = props.store.getAllValues(props.variable, props.type);
        this.state = {
            bins: this.getInitialBins(),
            binNames: ["Bin 1", "Bin 2"]
        };
        this.handleBinChange = this.handleBinChange.bind(this);
        this.handleNumberOfBinsChange = this.handleNumberOfBinsChange.bind(this);
        this.handleBinNameChange = this.handleBinNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * handles updateValues change (sliders are moved)
     * @param bins
     */
    handleBinChange(bins) {

        this.setState({
            bins: bins,
        })
    }

    getBinNames(bins) {
        let binNames = [];
        for (let i = 1; i < bins.length; i++) {
            binNames.push(Math.round(bins[i - 1]) + " - " + bins[i])
        }
        return binNames;
    }

    getInitialBins() {
        let min = d3.min(this.data);
        let max = d3.max(this.data);

        let med = (d3.max(this.data) + d3.min(this.data)) / 2;

        return [min, max, med];
    }

    handleNumberOfBinsChange(number) {
        let binNames = this.state.binNames.slice();
        if (number > this.state.binNames.length) {
            for (let i = this.state.binNames.length; i < number; i++) {
                binNames.push("Bin " + (i + 1));
            }
        }
        else {
            for (let i = 0; i < this.state.binNames.length - number; i++) {
                binNames.pop();
            }
        }
        this.setState({binNames: binNames})
    }

    close() {
        this.props.closeModal();
        this.setState({
            bins: [],
            binNames: ["Bin 1", "Bin 2"]
        });
    }


    /**
     * applies binning to data and color scales
     */
    handleApply() {
        const newId = uuidv4();
        let currVar = this.props.store.variableStores[this.props.type].referencedVariables[this.props.variable];
        if (!this.props.modify) {
            this.props.store.variableStores[this.props.type].addDerivedVariable(newId, currVar.name + "_BINNED", "BINNED", currVar.description + " (binned)", [currVar.id], "binning", {
                bins: this.state.bins,
                binNames: this.state.binNames
            }, this.props.display);
        }
        else {
            this.props.store.variableStores[this.props.type].modifyVariable(newId, currVar.name + "_BINNED", "BINNED", currVar.description + " (binned)", currVar.id, "binning", {
                bins: this.state.bins,
                binNames: this.state.binNames
            }, this.props.display);
        }
        if(this.props.callback!==null){
            this.props.callback(newId);
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
        let variableName = this.props.store.variableStores[this.props.type].getById(this.props.variable).name;
        return (
            <BinningModal data={this.data} binNames={this.state.binNames} bins={this.state.bins}
                          showAlert={this.props.callback !== null}
                          variableName={variableName} variable={this.props.variable}
                          handleBinChange={this.handleBinChange}
                          handleNumberOfBinsChange={this.handleNumberOfBinsChange}
                          handleBinNameChange={this.handleBinNameChange}
                          close={this.close} handleApply={this.handleApply} modalIsOpen={this.props.modalIsOpen}/>
        )
    }
});
export default ContinuousBinner;