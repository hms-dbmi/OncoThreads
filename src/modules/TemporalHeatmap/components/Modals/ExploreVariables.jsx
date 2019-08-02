import React from 'react';

import { inject, observer } from 'mobx-react';
import { Button, Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import {
    LineUp,
    LineUpCategoricalColumnDesc,
    LineUpColumn,
    LineUpNumberColumnDesc,
    LineUpRanking,
    LineUpStringColumnDesc,
    LineUpSupportColumn,
} from 'lineupjsx';
import { extendObservable } from 'mobx';
import OriginalVariable from '../../stores/OriginalVariable';
import DerivedVariable from '../../stores/DerivedVariable';


/**
 * Modal for exploring variables with lineUp
 */
const ExploreVariables = inject('rootStore', 'variableManagerStore')(observer(class ExploreVariables extends React.Component {
    constructor(props) {
        super(props);
        extendObservable(this, {
            selected: [],
        });

        this.handleAdd = this.handleAdd.bind(this);
    }

    /**
     * transforms data to the format required by lineUp
     * @return {Object[]}
     */
    transformData() {
        return this.props.variables.map((variable) => {
            const newEntry = {};
            const values = Object.values(variable.mapper).filter(d => d !== undefined);
            newEntry.name = variable.name;
            newEntry.score = NaN;
            newEntry.description = variable.description;
            newEntry.datatype = variable.datatype;
            newEntry.source = !variable.derived ? this.props.availableCategories.filter(category => category.id === variable.profile)[0].name : 'Derived';
            if (variable.datatype === 'NUMBER') {
                newEntry.range = Math.max(...values) - Math.min(...values);
                newEntry.categories = [];
                newEntry.numcat = NaN;
            } else {
                newEntry.range = NaN;
                newEntry.numcat = variable.domain.length;
                newEntry.categories = variable.domain.toString();
            }
            if (variable.profile === 'clinSample') {
                newEntry.score = this.props.rootStore.scoreStructure[variable.id];
            }
            newEntry.na = [].concat(...Object.values(this.props.rootStore.sampleStructure))
                .map(d => variable.mapper[d])
                .filter(d => d === undefined).length;
            newEntry.changeRate = this.props.rootStore
                .getChangeRate(variable.mapper, variable.datatype);
            /*
             * Example function calls for getting a score:
             *
             * across:
             * newEntry.modVRacross = this.props.rootStore.getModVRAcross(variable.mapper);
             *
             * within: (returns array of scores, one for each TP)
             * this.props.rootStore.gerModVRWithin(variable.mapper).forEach((d,i) => {
             *      newEntry['ModVRtp' + i]=d;
             * }
             *
             */
            return newEntry;
        });
    }

    /**
     * handles adding the selected variables
     */
    handleAdd() {
        this.props.variables.forEach((variable, i) => {
            if (this.selected.includes(i)) {
                this.props.variableManagerStore.addVariableToBeDisplayed(variable);
            }
        });
        this.props.reset();
        this.props.close();
    }


    render() {
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
                dialogClassName="fullSizeModal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Variable Explorer: LineUp</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <LineUp
                        data={this.transformData()}
                        sidePanelCollapsed
                        onSelectionChanged={(s) => {
                            this.selected = s;
                        }}
                        style={{ height: '800px' }}
                    >
                        {/*
                         Define column types
                         */}
                        <LineUpStringColumnDesc column="name" label="Name" />
                        <LineUpStringColumnDesc column="description" label="Description" />
                        <LineUpStringColumnDesc column="categories" label="Categories" />
                        <LineUpCategoricalColumnDesc column="source" />
                        <LineUpNumberColumnDesc column="score" label="Score" />
                        <LineUpNumberColumnDesc column="changeEntropy" label="Entropy" />
                        <LineUpNumberColumnDesc column="changeRate" label="Change Rate" />

                        <LineUpCategoricalColumnDesc
                            column="datatype"
                            categories={['STRING', 'NUMBER', 'ORDINAL', 'BINARY']}
                        />

                        <LineUpNumberColumnDesc column="numcat" label="NumCat" />
                        <LineUpNumberColumnDesc column="range" label="Range" />
                        <LineUpNumberColumnDesc column="na" label="Missing Values" />
                        {/*
                         Sets default columns, grouping, and ranking
                         */}
                        <LineUpRanking sortBy="changeRate:desc">
                            <LineUpSupportColumn type="*" />
                            <LineUpColumn column="name" />
                            <LineUpColumn column="source" />
                            <LineUpColumn column="changeRate" />
                            <LineUpColumn column="datatype" />
                            <LineUpColumn column="numcat" />
                            <LineUpColumn column="range" />
                            <LineUpColumn column="na" />
                        </LineUpRanking>
                    </LineUp>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.close}>Close</Button>
                    <Button onClick={this.handleAdd}>Add Selected</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}));
ExploreVariables.propTypes = {
    close: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
    variables: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.instanceOf(OriginalVariable),
        PropTypes.instanceOf(DerivedVariable)])).isRequired,
    availableCategories: PropTypes.arrayOf(PropTypes.object).isRequired,
};
export default ExploreVariables;
