import React from 'react';
import {observer} from 'mobx-react';
import {Button, Modal, Tab, Tabs} from 'react-bootstrap';
import AddTimepointVarTab from "./AddTimepointVarTab"
import UndoRedoStore from "../../UndoRedoStore";


const AddVarModal = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            currentTimepointVariables: this.props.store.variableStores.sample.currentVariables,
            referencedTimepointVariables: this.props.store.variableStores.sample.referencedVariables,
            currentEventVariables: this.props.store.variableStores.between.currentVariable,
            referenceEventVariable: this.props.store.variableStores.between.referencedVariables
        }
        ;
        this.setTimepointData = this.setTimepointData.bind(this);
        this.handleAddButton = this.handleAddButton.bind(this);
    }

    /**
     * sets the state of the timepoint data
     * @param currentVariables
     * @param referencedVariables
     */
    setTimepointData(currentVariables, referencedVariables) {
        this.setState({
            currentTimepointVariables: currentVariables.map(d => d.id),
            referencedTimepointVariables: referencedVariables
        })
    }

    /**
     * handles clicking the add button
     */
    handleAddButton() {
        this.props.store.variableStores.sample.referencedVariables = UndoRedoStore.deserializeReferencedVariables(this.props.store.variableStores.sample.referencedVariables, this.state.referencedTimepointVariables);
        this.props.store.variableStores.sample.currentVariables.replace(this.state.currentTimepointVariables.slice());
        this.props.store.rootStore.undoRedoStore.saveVariableHistory("VARIABLE MANAGER", this.props.store.variableStores.sample.currentVariables.map(d => this.props.store.variableStores.sample.getById(d).name), true);
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
                                currentVariables={this.props.store.variableStores.sample.currentVariables}
                                referencedVariables={this.props.store.variableStores.sample.referencedVariables}
                                setTimepointData={this.setTimepointData}
                                availableProfiles={this.props.store.rootStore.availableProfiles}
                                molProfileMapping={this.props.store.rootStore.molProfileMapping}
                                staticMappers={this.props.store.rootStore.staticMappers}
                                clinicalSampleCategories={this.props.clinicalSampleCategories}
                                clinicalPatientCategories={this.props.clinicalPatientCategories}/>
                        </Tab>
                        <Tab eventKey={2} title="Event Variables">
                            Coming soon
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
