import React from 'react';
import { inject, observer } from 'mobx-react';
import GlobalRowOperator from './GlobalRowOperator';

/**
 * Component for the Row operators of the variables in the global timeline
 */
const GlobalRowOperators = inject('dataStore')(observer(class GlobalRowOperators extends React.Component {
    constructor() {
        super();
        this.state = { width: 100 };
        this.updateDimensions = this.updateDimensions.bind(this);
        this.rowOperators = React.createRef();
    }


    /**
     * Add event listener
     */
    componentDidMount() {
        this.updateDimensions();
        window.addEventListener('resize', this.updateDimensions);
    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    /**
     * gets row operators for sample variables
     * @return {GlobalRowOperator}
     */
    getSampleRowHeader() {
        return (
            <GlobalRowOperator
                type="sample"
                width={this.state.width}
                height={this.props.dataStore.variableStores.sample.currentVariables.length * 20}
                openSaveVarModal={this.props.openSaveVarModal}
                {...this.props.tooltipFunctions}
            />
        );
    }

    /**
     * gets row operators for event variables
     * @return {(GlobalRowOperator|string)}
     */
    getEventRowHeader() {
        if (this.props.dataStore.transitionOn) {
            return (
                <GlobalRowOperator
                    type="between"
                    width={this.state.width}
                    height={this.props.dataStore.variableStores.between.getRelatedVariables('event').length * 20}
                    openSaveVarModal={this.props.openSaveVarModal}
                    {...this.props.tooltipFunctions}
                />
            );
        }

        return '-';
    }

    updateDimensions() {
        this.setState({
            width: this.rowOperators.current.parentNode.clientWidth,
        });
    }


    render() {
        return (
            <div ref={this.rowOperators}>
                <h5>Timepoint Variables</h5>
                {this.getSampleRowHeader()}
                <h5>Event Variables</h5>
                {this.getEventRowHeader()}
            </div>
        );
    }
}));
export default GlobalRowOperators;
