import React from 'react';

import { inject, observer } from 'mobx-react';
import { Button, Col, FormControl } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { extendObservable } from 'mobx';
import SelectAll from '../../../SelectAllSelector/react-select-all';


/**
 * Modal for exploring variables with lineUp
 */
const MutationSelector = inject('rootStore')(observer(class MutationSelector extends React.Component {
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
            get geneList() {
                if (this.geneListString.length > 0) {
                    const geneList = this.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, '').toUpperCase().split(' ');
                    geneList.forEach((d, i) => {
                        if (d.includes('ORF')) {
                            geneList[i] = d.replace('ORF', 'orf');
                        }
                    });
                    return geneList;
                }
                return [];
            },
        });
        // stores if user is actively typing in the search field
        this.typing = false;
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.addGeneVariables = this.addGeneVariables.bind(this);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterExplore = this.handleEnterExplore.bind(this);
        this.updateMutationOptions = this.updateMutationOptions.bind(this);
        this.updateMolecularOptions = this.updateMolecularOptions.bind(this);
    }

    /**
     * gets the textfield for adding genes
     * @return {*[]}
     */
    getGeneTextField() {
        return (
            <FormControl
                style={{ height: 38 }}
                type="textarea"
                placeholder="Enter one or multiple HUGO Gene Symbols (e.g. TP53 IDH1)"
                onChange={this.updateSearchValue}
                value={this.geneListString}
            />
        );
    }

    /**
     * gets the dropdown for the available genomic data
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
        return (
            <SelectAll
                isMulti
                searchable
                options={options}
                value={this.selectedOptions.slice()}
                onChange={this.handleOptionSelect}
                onKeyDown={this.handleEnterExplore}
                allowSelectAll
            />
        );
    }


    /**
     * updates molecular options for select dropdown
     * @param {string[]} containedProfiles
     * @return {{id: string, name: string}[]}
     */
    updateMolecularOptions(containedProfiles) {
        return this.props.rootStore.availableProfiles.filter(profile => profile.molecularAlterationType !== 'MUTATION_EXTENDED'
            && containedProfiles.includes(profile.molecularProfileId)).map(profile => ({
            id: profile.molecularProfileId,
            name: profile.name,
        }));
    }

    /**
     * updates mutation options for select dropdown
     * @param {boolean} hasMutations
     * @return {{id: string}[]}
     */
    updateMutationOptions(hasMutations) {
        if (hasMutations) {
            return this.props.rootStore.mutationMappingTypes.map(mappingType => ({
                id: mappingType,
            }));
        }
        return [];
    }


    /**
     * searches for the genes entered in the search field
     */
    searchGenes() {
        // check for which profiles data is available for the entered HUGOSymbols
        // only do this if the user was actively in the searchfield before
        // to prevent searching for gene multiple times
        if (this.geneList.length > 0 && this.typing === true) {
            let callback = (dataProfiles) => {
                const hasMutations = this.props.rootStore
                    .availableProfiles.filter(d => dataProfiles.includes(d.molecularProfileId))
                    .map(d => d.molecularAlterationType).includes('MUTATION_EXTENDED');
                this.mutationOptions = this.updateMutationOptions(hasMutations);
                this.molecularOptions = this.updateMolecularOptions(dataProfiles);
            };
            if (this.props.rootStore.isOwnData) {
                this.props.rootStore.molProfileMapping.getDataContainingProfiles(this.geneList, callback);
            } else {
                this.props.rootStore.molProfileMapping.getDataContainingProfiles(this.geneList, callback, this.props.rootStore.studyAPI.accessTokenFromUser);
            }
            this.typing = false;
        }
    }


    /**
     * updates the value of geneListString with the current content of the search field
     * @param {event} event
     */
    updateSearchValue(event) {
        this.typing = true;
        this.geneListString = event.target.value;
        this.mutationOptions = [];
        this.molecularOptions = [];
    }

    /**
     * handles pressing enter after entering genes into the search field
     * @param {event} event
     */
    handleEnterExplore(event) {
        if (MutationSelector.checkEnterPressed(event)) {
            this.addGeneVariables();
        }
    }

    /**
     * handles selectiing an option in the Select component
     * @param {object[]} selectedOptions
     */
    handleOptionSelect(selectedOptions) {
        if (selectedOptions !== null) {
            this.selectedOptions.replace(selectedOptions);
        } else {
            this.selectedOptions.clear();
        }
    }

    /**
     * adds gene variables to LineUp
     */
    addGeneVariables() {
        this.props.addGeneVariables(this.selectedOptions);
        this.geneListString = '';
        this.mutationOptions = [];
        this.molecularOptions = [];
        this.selectedOptions.clear();
    }


    render() {
        const style = {};
        if (this.props.noPadding) {
            style.padding = 0;
        }
        if (this.props.rootStore.hasProfileData) {
            return (
                [
                    <Col sm={5} style={style} key="textfield">
                        {this.getGeneTextField()}
                    </Col>,
                    <Col sm={5} onClick={this.searchGenes} style={style} key="geneSearch">
                        {this.getDataSelect()}
                    </Col>,
                    <Col sm={1} style={style} key="addButton">
                        <Button
                            disabled={this.molecularOptions.length === 0 && this.mutationOptions.length === 0}
                            style={{ height: 38 }}
                            onClick={this.addGeneVariables}
                        >
                            Add
                        </Button>
                    </Col>,
                ]
            );
        }
        return null;
    }
}));
MutationSelector.propTypes = {
    addGeneVariables: PropTypes.func.isRequired,
    noPadding: PropTypes.bool,
};
MutationSelector.defaultProps = {
    noPadding: false,
};
export default MutationSelector;
