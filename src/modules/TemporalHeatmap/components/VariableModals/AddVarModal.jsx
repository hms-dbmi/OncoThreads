import React from 'react';
import {observer} from 'mobx-react';
import {Button, Modal, Tab, Tabs} from 'react-bootstrap';
import AddTimepointVarTab from "./AddTimepointVarTab"
import UndoRedoStore from "../../UndoRedoStore";
import AddEventVarTab from "./AddEventVarTab";
import VariableManagerStore from "./VariableManagerStore";


const AddVarModal = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.timepointVariableManager = new VariableManagerStore(UndoRedoStore.serializeVariables(this.props.store.variableStores.sample.referencedVariables), this.props.store.variableStores.sample.currentVariables, this.props.store.variableStores.sample.childStore.timepoints.map(d => d.primaryVariableId), this.props.store.variableStores.sample.savedReferences);
        this.eventVariableManager = new VariableManagerStore(UndoRedoStore.serializeVariables(this.props.store.variableStores.between.referencedVariables), this.props.store.variableStores.between.currentVariables, this.props.store.variableStores.between.childStore.timepoints.map(d => d.primaryVariableId), this.props.store.variableStores.between.savedReferences);
        this.handleAddButton = this.handleAddButton.bind(this);
    }


    /**
     * handles clicking the add button
     */
    handleAddButton() {
        this.props.store.variableStores.sample.referencedVariables = UndoRedoStore.deserializeReferencedVariables(this.props.store.variableStores.sample.referencedVariables, this.timepointVariableManager.referencedVariables);
        this.props.store.variableStores.sample.currentVariables.replace(this.timepointVariableManager.currentVariables.map(d=>d.id));
        this.props.store.variableStores.between.referencedVariables = UndoRedoStore.deserializeReferencedVariables(this.props.store.variableStores.between.referencedVariables, this.eventVariableManager.referencedVariables);
        this.props.store.variableStores.between.currentVariables.replace(this.eventVariableManager.currentVariables.map(d=>d.id));
        this.props.store.variableStores.sample.childStore.timepoints.forEach((d, i) => d.setPrimaryVariable(this.timepointVariableManager.primaryVariables[i]));
        this.props.store.variableStores.between.childStore.timepoints.forEach((d, i) => d.setPrimaryVariable(this.eventVariableManager.primaryVariables[i]));
        this.props.store.rootStore.undoRedoStore.saveVariableHistory("VARIABLE MANAGER", this.props.store.variableStores.sample.currentVariables.map(d => this.props.store.variableStores.sample.getById(d).name) + "\n" + this.props.store.variableStores.between.currentVariables.map(d => this.props.store.variableStores.between.getById(d).name), true);
        this.props.closeAddModal();
    }


    render() {
        return (
            <Modal bsSize={"large"}
                   backdrop={"static"}
                   show={this.props.addModalIsOpen}
                   onHide={this.props.closeAddModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Variable Manager</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
                        <Tab eventKey={1} title="Timepoint Variables">
                            <AddTimepointVarTab
                                variableManagerStore={this.timepointVariableManager}
                                currentVariables={this.props.store.variableStores.sample.currentVariables}
                                availableProfiles={this.props.store.rootStore.availableProfiles}
                                mutationMappingTypes={this.props.store.rootStore.mutationMappingTypes}
                                molProfileMapping={this.props.store.rootStore.molProfileMapping}
                                staticMappers={this.props.store.rootStore.staticMappers}
                                clinicalSampleCategories={this.props.clinicalSampleCategories}
                                clinicalPatientCategories={this.props.clinicalPatientCategories}/>
                        </Tab>
                        <Tab eventKey={2} title="Event Variables">
                            <AddEventVarTab
                                variableManagerStore={this.eventVariableManager}
                                currentVariables={this.props.store.variableStores.between.currentVariables}
                                eventCategories={this.props.store.rootStore.eventCategories}
                                eventAttributes={this.props.store.rootStore.eventAttributes}
                                store={this.props.store.rootStore}
                                staticMappers={this.props.store.rootStore.staticMappers}/>
                        </Tab>
                    </Tabs>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.closeAddModal}>
                        Close
                    </Button>
                    <Button onClick={this.handleAddButton}>
                        Apply changes
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default AddVarModal;
