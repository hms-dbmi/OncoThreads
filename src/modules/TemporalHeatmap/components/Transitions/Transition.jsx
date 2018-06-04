import React from 'react';
import {observer} from 'mobx-react';
import LineTransition from './LineTransition/LineTransition'
import SankeyTransition from './SankeyTransition/SankeyTransition'
import GroupToPatientsTransition from './HeatmapGroupTransition/HeatmapGroupTransition'
/*
creates a transition:   SankeyTransition - between two grouped timepoints
                        GroupToPatientsTransition - between a grouped and a heatmap timepoint
                        LineTransition - between two heatmap timepoints
 */
const Transition = observer(class Transition extends React.Component {
    getTransition() {
        if (this.props.transition.type==="sankey") {
            return <SankeyTransition {...this.props}/>
        }
        else {
            if (this.props.transition.type==="groupToPatients") {
                return <GroupToPatientsTransition {...this.props}/>
            }

            else if (this.props.transition.type==="empty") {
                return null;
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