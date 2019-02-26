import React from 'react';
import {observer} from 'mobx-react';
import BinSelector from './BinSelector'
import BinNames from './BinNames'


const Binner = observer(class Binner extends React.Component {
    render() {
        return (
            <div>
                <BinSelector data={this.props.data}
                             width={this.props.width}
                             height={this.props.height}
                             xLabel={this.props.xLabel}
                             xScale={this.props.xScale}
                             yScale={this.props.yScale}
                             histBins={this.props.histBins}/>
                <BinNames/>
            </div>
        )
    }
});
export default Binner;