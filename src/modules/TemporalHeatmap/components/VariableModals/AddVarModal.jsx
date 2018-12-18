import React from 'react';
import {observer} from 'mobx-react';
import {Button, Modal, Tab, Tabs} from 'react-bootstrap';
import AddTimepointVarTab from "./AddTimepointVarTab"
import UndoRedoStore from "../../UndoRedoStore";
import AddEventVarTab from "./AddEventVarTab";


const AddVarModal = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            currentTimepointVariables: this.props.store.variableStores.sample.currentVariables,
            referencedTimepointVariables: this.props.store.variableStores.sample.referencedVariables,
            currentEventVariables: this.props.store.variableStores.between.currentVariables,
            referencedEventVariables: this.props.store.variableStores.between.referencedVariables
        }
        ;
        this.setTimepointData = this.setTimepointData.bind(this);
        this.setEventData = this.setEventData.bind(this);
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
     * sets the state of the event data
     * @param currentVariables
     * @param referencedVariables
     */
    setEventData(currentVariables, referencedVariables) {
        this.setState({
            currentEventVariables: currentVariables.map(d => d.id),
            referencedEventVariables: referencedVariables
        });
    }

    /**
     * handles clicking the add button
     */
    handleAddButton() {
        this.props.store.variableStores.sample.referencedVariables = UndoRedoStore.deserializeReferencedVariables(this.props.store.variableStores.sample.referencedVariables, this.state.referencedTimepointVariables);
        this.props.store.variableStores.sample.currentVariables.replace(this.state.currentTimepointVariables.slice());
        this.props.store.variableStores.between.referencedVariables = UndoRedoStore.deserializeReferencedVariables(this.props.store.variableStores.between.referencedVariables, this.state.referencedEventVariables);
        this.props.store.variableStores.between.currentVariables.replace(this.state.currentEventVariables.slice());
        this.props.store.rootStore.undoRedoStore.saveVariableHistory("VARIABLE MANAGER", this.props.store.variableStores.sample.currentVariables.map(d => this.props.store.variableStores.sample.getById(d).name)+"\n"+this.props.store.variableStores.between.currentVariables.map(d => this.props.store.variableStores.between.getById(d).name), true);
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
                                setData={this.setTimepointData}
                                availableProfiles={this.props.store.rootStore.availableProfiles}
                                mutationMappingTypes={this.props.store.rootStore.mutationMappingTypes}
                                molProfileMapping={this.props.store.rootStore.molProfileMapping}
                                staticMappers={this.props.store.rootStore.staticMappers}
                                clinicalSampleCategories={this.props.clinicalSampleCategories}
                                clinicalPatientCategories={this.props.clinicalPatientCategories}/>
                        </Tab>
                        <Tab eventKey={2} title="Event Variables">
                            <AddEventVarTab
                                currentVariables={this.props.store.variableStores.between.currentVariables}
                                referencedVariables={this.props.store.variableStores.between.referencedVariables}
                                eventCategories={this.props.store.rootStore.eventCategories}
                                eventAttributes={this.props.store.rootStore.eventAttributes}
                                setData={this.setEventData}
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
