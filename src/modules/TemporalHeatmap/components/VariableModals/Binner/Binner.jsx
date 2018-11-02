import React from 'react';
import {observer} from 'mobx-react';
import BinSelector from './BinSelector'
import BinNames from './BinNames'


const Binner = observer(class Binner extends React.Component {
    constructor() {
        super();
        this.handleBinNameChange=this.handleBinNameChange.bind(this);
        this.handleNumberOfBinsChange=this.handleNumberOfBinsChange.bind(this);
    }


    static getBinNames(bins) {
        let binNames = [];
        for (let i = 1; i < bins.length; i++) {
            binNames.push(Math.round(bins[i - 1]) + " - " + bins[i])
        }
        return binNames;
    }


    handleNumberOfBinsChange(number) {
        let binNames = this.props.binNames.slice();
        if (number > this.props.binNames.length) {
            for (let i = this.props.binNames.length; i < number; i++) {
                binNames.push("Bin " + (i + 1));
            }
        }
        else {
            for (let i = 0; i < this.props.binNames.length - number; i++) {
                binNames.pop();
            }
        }
        this.props.handleBinNameChange(binNames);
    }


    /**
     * handles the name change of the bins
     * @param e
     * @param index
     */
    handleBinNameChange(e, index) {
        let binNames = this.props.binNames.slice();
        binNames[index] = e.target.value;
        this.props.handleBinNameChange(binNames);
    }

    render() {
        return (
            <div style={{position:"static"}}>
                <BinSelector data={this.props.data} width={this.props.width} height={this.props.height}
                             variableName={this.props.variable.name}
                             handleBinChange={this.props.handleBinChange}
                             xScale={this.props.xScale}
                             yScale={this.props.yScale}
                             histBins={this.props.histBins}
                             isXLog={this.props.isXLog}
                             handleNumberOfBinsChange={this.handleNumberOfBinsChange}/>
                <BinNames binNames={this.props.binNames} handleBinNameChange={this.handleBinNameChange}/>
            </div>
        )
    }
});
export default Binner;