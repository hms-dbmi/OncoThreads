import React from 'react';
import {observer} from 'mobx-react';
import ReactMixins from "../../../utils/ReactMixins.js";
import Histogram from "./Histogram.jsx";
import * as d3 from "d3";

const MultipleHist = observer(class MultipleHist extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 500
        };
        ReactMixins.call(this);
    }

    render() {
        const margin = {top: 5, right: 50, bottom: 20, left: 50},
            w = this.state.width - (margin.left + margin.right),
            h = this.props.height - (margin.top + margin.bottom);

        const transform = 'translate(' + margin.left + ',' + margin.top + ')';
        const transformLeft = 'translate(0,0)';
        const transformRight = 'translate(' + (margin.left + 0.5 * w) + ',' + margin.top + ')';
        const xDomain=[0,d3.max(this.props.data[0])];
        return (
            <div>
            <svg width={this.state.width} height={this.props.width}>
                <g transform={transform}>
                    <g transform={transformLeft}>
                        <Histogram data={this.props.data[0]} width={w / 2} height={h} xDomain={xDomain}/>
                    </g>
                    <g transform={transformRight}>
                        <Histogram data={this.props.data[1]} width={w / 2} height={h} xDomain={xDomain}/>
                    </g>
                </g>
            </svg>
            </div>
        )
    }
});
MultipleHist.defaultProps = {
    width: 600,
    height: 300
};
export default MultipleHist;