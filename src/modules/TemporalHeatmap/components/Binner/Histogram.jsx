import React from 'react';
import {observer} from 'mobx-react';

const Histogram = observer(class Histogram extends React.Component {
    render() {
        const _self = this;
        const bars = this.props.bins.map(function (d, i) {
            return (
                <rect key={i} x={_self.props.xScale(d.x0)} y={_self.props.yScale(d.length)}
                      width={_self.props.xScale(d.x1) - _self.props.xScale(d.x0)}
                      style={{stroke:'white'}}
                      height={_self.props.height - _self.props.yScale(d.length)} fill="lightblue"/>
            );
        });
        return (
            <g>
                {bars}
            </g>
        )
    }
});
export default Histogram;