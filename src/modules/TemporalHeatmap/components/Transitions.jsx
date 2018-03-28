import React from 'react';
import {observer} from 'mobx-react';
import * as d3 from "d3";
import Transition from './Transition'

const Transitions = observer(class Transitions extends React.Component {
    constructor() {
        super();
        this.colorCategorical = d3.scaleOrdinal().range(['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a']);
    }


    getTransitions() {
        const _self=this;
        return (this.props.transitionData.map(function (d, i) {
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "transition"} transform={transform}><Transition transition={d}
                                                                                firstPositions={_self.props.xPositions[i]}
                                                                                secondPositions={_self.props.xPositions[i + 1]}
                                                                                height={_self.props.height}/>
            </g>);
        }))
    }

    render() {
        return (
            this.getTransitions()
        )
    }
});
export default Transitions;