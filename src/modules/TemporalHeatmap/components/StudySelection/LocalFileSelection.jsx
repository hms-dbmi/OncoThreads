import React from 'react';
import {inject, observer} from 'mobx-react';
import {
    Col, Form, FormControl, FormGroup, HelpBlock, Alert,
} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import uuidv4 from 'uuid/v4';
import {extendObservable, observe} from 'mobx';
import SelectDatatype from '../Modals/SelectDatatype';


/*
 * Component for view if no study has been loaded
 * used for selection of studies from cBio or own data sets
 */
const LocalFileSelection = inject('rootStore', 'undoRedoStore')(observer(class LocalFileSelection extends React.Component {
    /**
     * gets the icon corresponding to the current loading state
     * @param {string} value - loading, error, finished or empty
     * @returns {FontAwesome}
     */
    static getStateIcon(value) {
        let icon = null;
        if (value === 'finished') {
            icon = <FontAwesome name="check" style={{color: 'green'}}/>;
        } else if (value === 'loading') {
            icon = <FontAwesome name="spinner" spin style={{color: 'gray'}}/>;
        } else if (value === 'error') {
            icon = <FontAwesome name="times" style={{color: 'red'}}/>;
        }
        return icon;
    }

    constructor(props) {
        super(props);
        extendObservable(this, {
            callback: null,
            modalIsOpen: false,
            fileNames: [],
            datatypes: [],
        });
        // random keys for file inputs used for reset (inputs are reset if key changes to 'empty')
        this.keys = {
            events: uuidv4(),
            mutations: uuidv4(),
            molecular: uuidv4(),
            clinicalPatient: uuidv4(),
            clinicalSample: uuidv4(),
            panelMatrix: uuidv4(),
            genePanels: uuidv4(),
        };
        this.handleEventsLoad = this.handleEventsLoad.bind(this);
        this.handleClinicalSampleLoad = this.handleClinicalSampleLoad.bind(this);
        this.handleClinicalPatientLoad = this.handleClinicalPatientLoad.bind(this);
        this.handleMutationsLoad = this.handleMutationsLoad.bind(this);
        this.handleMolecularLoad = this.handleMolecularLoad.bind(this);
        this.setDatatype = this.setDatatype.bind(this);
        this.handleGeneMatrixLoad = this.handleGeneMatrixLoad.bind(this);
        this.handleGenePanelsLoad = this.handleGenePanelsLoad.bind(this);

        observe(props.rootStore.localFileLoader.parsingStatus, (change) => {
            if (change.oldValue !== 'empty' && change.newValue === 'empty') {
                this.keys[change.name] = uuidv4();
            }
        });
    }

    /**
     * gets form for local file loading
     * @return {Form|div}
     */
    getForm() {
        const parsingStatus = this.props.rootStore.localFileLoader.parsingStatus;
        if (this.props.rootStore.geneNamesAPI.geneListLoaded) {
            return (
                <Form horizontal>
                    <h4>Required files</h4>
                    <FormGroup>
                        <Col sm={5}>
                            Timeline
                            {' '}
                            {LocalFileSelection.getStateIcon(parsingStatus.events)}
                        </Col>
                        <Col sm={6}>
                            <FormControl
                                type="file"
                                key={this.keys.events}
                                label="File"
                                multiple
                                onChange={this.handleEventsLoad}
                            />
                        </Col>
                        <Col sm={1}>
                            <div
                                style={{visibility: parsingStatus.events === 'empty' ? 'hidden' : 'visible'}}
                            >
                                <FontAwesome
                                    name="times"
                                    onClick={() => this.props.rootStore.localFileLoader.setEventsParsed('empty')}
                                />
                            </div>
                        </Col>
                    </FormGroup>
                    <h4>At least one required</h4>
                    <FormGroup>
                        <Col sm={5}>
                            Clinical Sample Data
                            {' '}
                            {LocalFileSelection.getStateIcon(parsingStatus.clinicalSample)}
                        </Col>
                        <Col sm={6}>
                            <FormControl
                                type="file"
                                key={this.keys.clinicalSample}
                                label="File"
                                onChange={this.handleClinicalSampleLoad}
                            />
                        </Col>
                        <Col sm={1}>
                            <div
                                style={{visibility: parsingStatus.clinicalSample === 'empty' ? 'hidden' : 'visible'}}
                            >
                                <FontAwesome
                                    name="times"
                                    onClick={() => this.props.rootStore.localFileLoader.setClinicalSampleParsed('empty')}
                                />
                            </div>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col sm={5}>
                            Clinical Patient Data
                            {' '}
                            {LocalFileSelection.getStateIcon(parsingStatus.clinicalPatient)}
                        </Col>
                        <Col sm={6}>
                            <FormControl
                                type="file"
                                key={this.keys.clinicalPatient}
                                label="File"
                                onChange={this.handleClinicalPatientLoad}
                            />
                        </Col>
                        <Col sm={1}>
                            <div
                                style={{visibility: parsingStatus.clinicalPatient === 'empty' ? 'hidden' : 'visible'}}
                            >
                                <FontAwesome
                                    name="times"
                                    onClick={() => this.props.rootStore.localFileLoader.setClinicalPatientParsed('empty')}
                                />
                            </div>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col sm={5}>
                            Mutations
                            {' '}
                            {LocalFileSelection.getStateIcon(parsingStatus.mutations)}
                        </Col>
                        <Col sm={6}>
                            <FormControl
                                type="file"
                                key={this.keys.mutations}
                                label="File"
                                onChange={this.handleMutationsLoad}
                            />
                        </Col>
                        <Col sm={1}>
                            <div
                                style={{visibility: parsingStatus.mutations === 'empty' ? 'hidden' : 'visible'}}
                            >
                                <FontAwesome
                                    name="times"
                                    onClick={() => this.props.rootStore.localFileLoader.setMutationsParsed('empty')}
                                />
                            </div>
                        </Col>
                    </FormGroup>
                    <h4>Optional files</h4>
                    <FormGroup>
                        <Col sm={5}>
                            Other files
                            {' '}
                            {LocalFileSelection.getStateIcon(parsingStatus.molecular)}
                        </Col>
                        <Col sm={6}>
                            <FormControl
                                type="file"
                                key={this.keys.molecular}
                                label="File"
                                multiple
                                onChange={this.handleMolecularLoad}
                            />
                            <HelpBlock>
                                expression data, CNV data,
                                protein levels, methylation data
                            </HelpBlock>
                        </Col>
                        <Col sm={1}>
                            <div
                                style={{visibility: parsingStatus.molecular === 'empty' ? 'hidden' : 'visible'}}
                            >
                                <FontAwesome
                                    name="times"
                                    onClick={() => this.props.rootStore.localFileLoader.setMolecularParsed('empty')}
                                />
                            </div>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col sm={5}>
                            Gene Panel Matrix
                            {' '}
                            {LocalFileSelection.getStateIcon(parsingStatus.panelMatrix)}
                        </Col>
                        <Col sm={6}>
                            <FormControl
                                type="file"
                                key={this.keys.panelMatrix}
                                label="File"
                                onChange={this.handleGeneMatrixLoad}
                            />
                        </Col>
                        <Col sm={1}>
                            <div
                                style={{visibility: parsingStatus.panelMatrix === 'empty' ? 'hidden' : 'visible'}}
                            >
                                <FontAwesome
                                    name="times"
                                    onClick={() => this.props.rootStore.localFileLoader.setPanelMatrixParsed('empty')}
                                />
                            </div>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col sm={5}>
                            Gene Panels
                            {' '}
                            {LocalFileSelection.getStateIcon(parsingStatus.genePanels)}
                        </Col>
                        <Col sm={6}>
                            <FormControl
                                type="file"
                                key={this.keys.genePanels}
                                label="File"
                                multiple
                                onChange={this.handleGenePanelsLoad}
                            />
                        </Col>
                        <Col sm={1}>
                            <div
                                style={{visibility: parsingStatus.genePanels === 'empty' ? 'hidden' : 'visible'}}
                            >
                                <FontAwesome
                                    name="times"
                                    onClick={() => this.props.rootStore.localFileLoader.setGenePanelsParsed('empty')}
                                />
                            </div>
                        </Col>
                    </FormGroup>
                </Form>
            );
        }
        return (<div><FontAwesome name="spinner" spin style={{color: 'gray'}}/></div>);
    }

    /**
     * gets the modal for selecting CNV data types
     * @return {SelectDatatype|null}
     */
    getModal() {
        if (this.modalIsOpen) {
            return (
                <SelectDatatype
                    modalIsOpen={this.modalIsOpen}
                    fileNames={this.fileNames.slice()}
                    setDatatype={this.setDatatype}
                    selectedTypes={this.datatypes.map(d => d.key)}
                    callback={this.callback}
                    closeModal={() => {
                        this.modalIsOpen = false;
                    }}
                />
            );
        }
        return null;
    }

    /**
     * sets datatypes of currently selected files
     * @param {number} index
     * @param {string} key
     * @param {string} alterationType
     * @param {string} datatype
     */
    setDatatype(index, key, datatype, alterationType) {
        this.datatypes[index] = {key, alterationType, datatype}
    }


    /**
     * handles selection of event files
     * @param {event} e
     */
    handleEventsLoad(e) {
        if (e.target.files.length > 0) {
            this.props.rootStore.localFileLoader.setEventFiles(e.target.files, () => {
                this.props.rootStore.parseTimeline(null, () => {
                });
            });
        } else {
            this.props.rootStore.localFileLoader.setEventsParsed('empty');
        }
    }

    /**
     * handles selection of clinical sample specific file
     * @param {event} e
     */
    handleClinicalSampleLoad(e) {
        if (e.target.files.length > 0) {
            this.props.rootStore.localFileLoader.setClinicalFile(e.target.files[0], true);
        } else {
            this.props.rootStore.localFileLoader.setClinicalSampleParsed('empty');
        }
    }

    /**
     * handles selection of clinical patient specific file
     * @param {event} e
     */
    handleClinicalPatientLoad(e) {
        if (e.target.files.length > 0) {
            this.props.rootStore.localFileLoader.setClinicalFile(e.target.files[0], false);
        } else {
            this.props.rootStore.localFileLoader.setClinicalPatientParsed('empty');
        }
    }

    /**
     * handles selection of mutation file
     * @param {event} e
     */
    handleMutationsLoad(e) {
        if (e.target.files.length > 0) {
            this.props.rootStore.localFileLoader.setMutations(e.target.files[0]);
        } else {
            this.props.rootStore.localFileLoader.setMutationsParsed('empty');
        }
    }

    /**
     * opens modal for datatype selection
     * @param {FileList} files
     * @param {Function} callback
     */
    openModal(files, callback) {
        this.modalIsOpen = true;
        this.datatypes = Array.from(files).map(() => ({key: 'UnspecCont', alterationType: 'ANY', datatype: 'CONTINUOUS'}));
        this.fileNames = Array.from(files).map(d => d.name);
        this.callback = callback;
    }

    /**
     * handles selection of CNV files
     * @param {event} e
     */
    handleMolecularLoad(e) {
        e.persist();
        if (e.target.files.length > 0) {
            this.openModal(e.target.files, (setFiles) => {
                if (setFiles) {
                    this.props.rootStore.localFileLoader
                        .setMolecularFiles(e.target.files, this.datatypes);
                } else {
                    e.target.value = null;
                }
            });
        } else {
            this.props.rootStore.localFileLoader.setMolecularParsed('empty');
        }
    }

    /**
     * handles loading gene matrix
     * @param {event} e
     */
    handleGeneMatrixLoad(e) {
        this.props.rootStore.localFileLoader.setGenePanelMatrix(e.target.files[0]);
    }

    /**
     * handles loading gene panels
     * @param {event} e
     */
    handleGenePanelsLoad(e) {
        this.props.rootStore.localFileLoader.setGenePanels(e.target.files);
    }


    render() {
        let msg = <Alert>Data uploaded on this page will not leave your computer.</Alert>;
        return (
            <div>
                <br></br>
                {msg}
                <a
                    href="https://github.com/hms-dbmi/OncoThreads/wiki/OncoThreads-File-Formats"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    File format documentation and example data
                </a>
                {this.getForm()}
                {this.getModal()}
            </div>
        );
    }
}));
export default LocalFileSelection;
