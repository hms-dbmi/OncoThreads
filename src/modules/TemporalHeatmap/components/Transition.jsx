import React from 'react';
import {observer} from 'mobx-react';
import LineTransition from './LineTransition'

const Transition = observer(class Transition extends React.Component {
    getTransition() {
        if (this.props.transition.type==="sankey") {

        }
        else {
            if (this.props.transition.type==="groupToPatients") {

            }
            else {
                //case lines
                return <LineTransition {...this.props}/>
            }
        }

    }

    render() {
        return (
            <g>
                {this.getTransition()}
            </g>
        )
    }
});
export default Transition;