import React from 'react';
import {observer} from 'mobx-react';
import LineTransition from './LineTransition'
import SankeyTransition from './SankeyTransition'
import GroupToPatientsTransition from './HeatmapGroupTransition'

const Transition = observer(class Transition extends React.Component {
    getTransition() {
        if (this.props.transition.type==="sankey") {
            return <SankeyTransition {...this.props}/>
        }
        else {
            if (this.props.transition.type==="groupToPatients") {
                return <GroupToPatientsTransition {...this.props}/>
            }
            else {
                return <LineTransition {...this.props}/>
            }
        }

    }

    render() {
        return (
            this.getTransition()
        )
    }
});
export default Transition;