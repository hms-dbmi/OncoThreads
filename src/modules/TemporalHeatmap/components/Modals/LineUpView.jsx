import React from 'react';

import { inject, observer } from 'mobx-react';
import {
    Alert, Button, Col, ControlLabel, Form, FormControl, FormGroup, Grid, Row,
} from 'react-bootstrap';
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
import { ScaleMappingFunction } from 'lineupjs';
import SelectAll from '../../../SelectAllSelector/react-select-all';


/**
 * Modal for exploring variables with lineUp
 */
const LineUpView = inject('rootStore', 'variableManagerStore')(observer(class LineUpView extends React.Component {
    static checkEnterPressed(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            return true;
        }
        return false;
    }

    constructor(props) {
        super(props);
        extendObservable(this, {
            geneListString: '',
            mutationOptions: [],
            molecularOptions: [],
            selectedOptions: [],
            showAvailableData: false,
        });
        this.lineUpRef = React.createRef();
        this.handleAdd = this.handleAdd.bind(this);
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.addGeneVariables = this.addGeneVariables.bind(this);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterSearch = this.handleEnterSearch.bind(this);
        this.handleEnterExplore = this.handleEnterExplore.bind(this);
        this.updateMutationOptions = this.updateMutationOptions.bind(this);
        this.updateMolecularOptions = this.updateMolecularOptions.bind(this);
        this.resetSelected = this.resetSelected.bind(this);
    }

    componentDidMount() {
        this.updateLineUp();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.data.length !== this.props.data.length) {
            this.updateLineUp();
        }
    }

    getGeneTextField() {
        return [
            <Col sm={5} key="textField">
                <FormControl
                    style={{ height: 38 }}
                    type="textarea"
                    placeholder="Enter one or multiple HUGO Gene Symbols (e.g. TP53 IDH1)"
                    onChange={this.updateSearchValue}
                    onKeyDown={this.handleEnterSearch}
                    value={this.geneListString}
                />
            </Col>,
            <Col sm={1} key="search">
                <Button
                    style={{ height: 38 }}
                    onClick={this.searchGenes}
                >
                    Search
                </Button>
            </Col>,
        ];
    }

    /**
     * gets the checkboxes for the available genomic data
     * @returns {Form}
     */
    getDataSelect() {
        const options = [];
        if (this.mutationOptions.length > 0) {
            this.mutationOptions.forEach((d) => {
                options.push({ label: d.id, value: d.id, type: 'mutation' });
            });
        }
        if (this.molecularOptions.length > 0) {
            this.molecularOptions.forEach((d) => {
                options.push({ label: d.name, value: d.id, type: 'molecular' });
            });
        }
        if (this.mutationOptions.length > 0 || this.molecularOptions.length > 0) {
            return ([
                <Col sm={5} key="select">
                    <SelectAll
                        isMulti
                        searchable
                        options={options}
                        value={this.selectedOptions.slice()}
                        onChange={this.handleOptionSelect}
                        onKeyDown={this.handleEnterExplore}
                        allowSelectAll
                    />
                </Col>,
                <Col sm={1} key="explore">
                    <Button
                        style={{ height: 38 }}
                        onClick={this.addGeneVariables}
                    >
                        Explore
                    </Button>
                </Col>,
            ]);
        }
        return <Col sm={5}>No data available for gene(s)</Col>;
    }

    getGeneSearch() {
        if (this.props.rootStore.availableProfiles.length > 0) {
            return (
                <Form horizontal>
                    <FormGroup>
                        <Col sm={6}>
                            <ControlLabel>Search for Genes</ControlLabel>
                        </Col>
                        {this.showAvailableData
                            ? (
                                <Col sm={6}>
                                    <ControlLabel>Available Data</ControlLabel>
                                </Col>
                            ) : null}
                    </FormGroup>
                    <FormGroup>
                        {this.getGeneTextField()}
                        {this.showAvailableData ? this.getDataSelect() : null}
                    </FormGroup>
                </Form>
            );
        }
        return null;
    }


    /**
     * updates the checkboxes showing the different mutation data types
     * @param {boolean} hasData
     */
    updateMutationOptions(hasData) {
        if (hasData) {
            this.props.rootStore.mutationMappingTypes.forEach((d) => {
                this.mutationOptions.push({ id: d });
            });
        }
        this.showAvailableData = true;
    }

    /**
     * updates the checkboxes showing the different molecular profiles
     * @param {string} profile
     * @param {boolean} hasData
     */
    updateMolecularOptions(profile, hasData) {
        if (hasData) {
            if (!this.molecularOptions.map(d => d.id).includes(profile)) {
                this.molecularOptions.push({
                    id: profile,
                    name: this.props.rootStore.availableProfiles
                        .filter(d => d.molecularProfileId === profile)[0].name,
                });
            }
        } else if (this.molecularOptions.map(d => d.id).includes(profile)) {
            this.molecularOptions.splice(this.molecularOptions.map(d => d.id).indexOf(profile), 1);
        }
        this.showAvailableData = true;
    }

    /**
     * searches for the genes entered in the search field
     */
    searchGenes() {
        this.molecularOptions = [];
        this.mutationOptions = [];
        const geneList = this.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, '').toUpperCase().split(' ');
        geneList.forEach((d, i) => {
            if (d.includes('ORF')) {
                geneList[i] = d.replace('ORF', 'orf');
            }
        });
        // check for which profiles data is available for the entered HUGOSymbols
        this.props.rootStore.molProfileMapping
            .getDataContainingProfiles(geneList, (dataProfiles) => {
                this.props.rootStore.availableProfiles.forEach((d) => {
                    if (d.molecularAlterationType === 'MUTATION_EXTENDED') {
                        this.updateMutationOptions(dataProfiles
                            .includes(d.molecularProfileId));
                    } else {
                        this.updateMolecularOptions(d.molecularProfileId, dataProfiles
                            .includes(d.molecularProfileId));
                    }
                });
            });
    }


    /**
     * updates the value of geneListString with the current content of the search field
     * @param {event} event
     */
    updateSearchValue(event) {
        this.geneListString = event.target.value;
        this.showAvailableData = false;
    }

    /**
     * handles pressing enter after entering genes into the search field
     * @param {event} event
     */
    handleEnterSearch(event) {
        if (LineUpView.checkEnterPressed(event)) {
            this.searchGenes();
        }
    }

    /**
     * handles pressing enter after entering genes into the search field
     * @param {event} event
     */
    handleEnterExplore(event) {
        if (LineUpView.checkEnterPressed(event)) {
            this.addGeneVariables();
        }
    }

    handleOptionSelect(selectedOptions) {
        this.selectedOptions = selectedOptions;
    }

    addGeneVariables() {
        this.props.addGeneVariables(this.selectedOptions);
        this.resetSelected();
    }

    resetSelected() {
        this.geneListString = '';
        this.showAvailableData = false;
        this.selectedOptions.clear();
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

    updateLineUp() {
        const numCatColumn = this.lineUpRef.current.adapter.data.find(d => d.desc.type === 'number' && d.desc.column === 'numcat');
        const numCatValues = this.props.data.map(d => d.numcat).filter(d => !Number.isNaN(d));
        numCatColumn.setMapping(new ScaleMappingFunction([Math.min(...numCatValues), Math.max(...numCatValues)], 'linear'));

        const naColumn = this.lineUpRef.current.adapter.data.find(d => d.desc.type === 'number' && d.desc.column === 'na');
        const naValues = this.props.data.map(d => d.na).filter(d => !Number.isNaN(d));
        naColumn.setMapping(new ScaleMappingFunction([Math.min(...naValues), Math.max(...naValues)], 'linear'));

        const rangeColumn = this.lineUpRef.current.adapter.data.find(d => d.desc.type === 'number' && d.desc.column === 'range');
        const rangeValues = this.props.data.map(d => d.range).filter(d => !Number.isNaN(d));
        rangeColumn.setMapping(new ScaleMappingFunction([Math.min(...rangeValues), Math.max(...rangeValues)], 'linear'));

        this.lineUpRef.current.adapter.data.setData(this.props.data);
    }


    render() {
        return (
            <Grid fluid>
                <Row>
                    {this.getGeneSearch()}
                </Row>
                <Row>
                    <LineUp
                        data={[]}
                        ref={this.lineUpRef}
                        sidePanelCollapsed
                        onSelectionChanged={(s) => {
                            this.props.handleSelect(s);
                        }}
                        selection={this.props.selected}
                        style={{ height: '600px' }}
                    >
                        {/*
                         Define column types
                         */}
                        <LineUpStringColumnDesc column="name" label="Name" />
                        <LineUpStringColumnDesc column="description" label="Description" />
                        <LineUpStringColumnDesc column="categories" label="Categories" />
                        <LineUpCategoricalColumnDesc
                            column="source"
                            categories={this.props.availableCategories.map(d => d.name).concat('Derived')}
                        />
                        <LineUpNumberColumnDesc column="changeRate" domain={[0, 1]} label="Change Rate" />

                        <LineUpCategoricalColumnDesc
                            column="datatype"
                            categories={['STRING', 'NUMBER', 'ORDINAL', 'BINARY']}
                        />

                        <LineUpNumberColumnDesc column="numcat" label="NumCat" />
                        <LineUpNumberColumnDesc column="range" label="Range" />
                        <LineUpNumberColumnDesc column="na" label="Missing Values" />
                        <LineUpCategoricalColumnDesc
                            column="inTable"
                            categories={['Yes', 'No']}
                        />
                        {/*
                         Sets default columns, grouping, and ranking
                         */}
                        <LineUpRanking>
                            <LineUpSupportColumn type="*" />
                            <LineUpColumn column="name" />
                            <LineUpColumn column="source" />
                            <LineUpColumn column="changeRate" />
                            <LineUpColumn column="datatype" />
                            <LineUpColumn column="numcat" />
                            <LineUpColumn column="range" />
                            <LineUpColumn column="na" />
                            <LineUpColumn column="inTable" />
                        </LineUpRanking>
                    </LineUp>
                </Row>
            </Grid>
        );
    }
}));
LineUpView.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    selected: PropTypes.arrayOf(PropTypes.number).isRequired,
    handleSelect: PropTypes.func.isRequired,
    addGeneVariables: PropTypes.func.isRequired,
};
export default LineUpView;
