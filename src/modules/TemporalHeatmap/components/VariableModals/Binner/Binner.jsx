import React from 'react';
import {observer} from 'mobx-react';
import BinSelector from './BinSelector'
import BinNames from './BinNames'


const Binner = observer(class Binner extends React.Component {
    render() {
        return (
            <div>
                <BinSelector data={this.props.data} width={this.props.width} height={this.props.height}
                             xLabel={this.props.xLabel}
                             handleBinChange={this.props.handleBinChange}
                             xScale={this.props.xScale}
                             yScale={this.props.yScale}
                             histBins={this.props.histBins}
                             isBinary={this.props.isBinary}
                             toggleIsBinary={this.props.toggleIsBinary}
                             bins={this.props.bins}/>
                <BinNames binNames={this.props.binNames} handleBinNameChange={this.props.handleBinNameChange} isBinary={this.props.isBinary}/>
            </div>
        )
    }
});
export default Binner;