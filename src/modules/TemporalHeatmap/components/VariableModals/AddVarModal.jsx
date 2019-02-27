import React from 'react';
import {inject, observer, Provider} from 'mobx-react';
import {Button, Modal, Tab, Tabs} from 'react-bootstrap';
import AddTimepointVarTab from "./AddTimepointVarTab"
import UndoRedoStore from "../../../UndoRedoStore";
import AddEventVarTab from "./AddEventVarTab";
import VariableManagerStore from "./VariableManagerStore";


const AddVarModal = inject("rootStore", "undoRedoStore")(observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.timepointVariableManager = new VariableManagerStore(UndoRedoStore.serializeVariables(this.props.rootStore.dataStore.variableStores.sample.referencedVariables),
            this.props.rootStore.dataStore.variableStores.sample.currentVariables,
            this.props.rootStore.dataStore.variableStores.sample.childStore.timepoints.map(d => d.primaryVariableId),
            this.props.rootStore.dataStore.variableStores.sample.savedReferences);
        this.eventVariableManager = new VariableManagerStore(UndoRedoStore.serializeVariables(this.props.rootStore.dataStore.variableStores.between.referencedVariables),
            this.props.rootStore.dataStore.variableStores.between.currentVariables,
            this.props.rootStore.dataStore.variableStores.between.childStore.timepoints.map(d => d.primaryVariableId),
            this.props.rootStore.dataStore.variableStores.between.savedReferences);
        this.handleAddButton = this.handleAddButton.bind(this);
    }


    /**
     * handles clicking the add button
     */
    handleAddButton() {
        this.props.rootStore.dataStore.variableStores.sample.replaceAll(this.timepointVariableManager.referencedVariables, this.timepointVariableManager.currentVariables.map(d => d.id),
            this.timepointVariableManager.primaryVariables);
        this.props.rootStore.dataStore.variableStores.between.replaceAll(this.eventVariableManager.referencedVariables, this.eventVariableManager.currentVariables.map(d => d.id),
            this.eventVariableManager.primaryVariables);
        this.props.undoRedoStore.saveVariableHistory("VARIABLE MANAGER", this.props.rootStore.dataStore.variableStores.sample.currentVariables.map(d => this.props.rootStore.dataStore.variableStores.sample.getById(d).name) + "\n" + this.props.rootStore.dataStore.variableStores.between.currentVariables.map(d => this.props.rootStore.dataStore.variableStores.between.getById(d).name), true);
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
                            <Provider variableManagerStore={this.timepointVariableManager}>
                                <AddTimepointVarTab/>
                            </Provider>
                        </Tab>
                        <Tab eventKey={2} title="Event Variables">
                            <Provider variableManagerStore={this.eventVariableManager}>
                                <AddEventVarTab/>
                            </Provider>
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
}));
export default AddVarModal;
