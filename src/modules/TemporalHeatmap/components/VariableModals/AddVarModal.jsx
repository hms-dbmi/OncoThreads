import React from 'react';
import {observer} from 'mobx-react';
import {Button, Modal, Tab, Tabs} from 'react-bootstrap';
import AddTimepointVarTab from "./AddTimepointVarTab"
import UndoRedoStore from "../../UndoRedoStore";


const AddVarModal = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            timepoint:{
                currentVariables:props.store.currentVariables,
                referencedVariables:props.store.referencedVariables,
            },
            eventData: []
    }
        ;
        this.setTimepointData = this.setTimepointData.bind(this);
        this.handleAddButton = this.handleAddButton.bind(this);
    }

    setTimepointData(currentVariables, referencedVariables) {
        this.setState({
            timepoint: {
                currentVariables: currentVariables.map(d=>d.id),
                referencedVariables: referencedVariables,
            }
        })
    }


    /**
     * handles clicking the add button
     */
    handleAddButton() {
        this.props.store.referencedVariables=UndoRedoStore.deserializeReferencedVariables(this.props.store.referencedVariables,this.state.timepoint.referencedVariables);

        this.props.store.currentVariables.replace(this.state.timepoint.currentVariables.slice());
        this.props.store.rootStore.undoRedoStore.saveVariableHistory("VARIABLE MANAGER",this.props.store.currentVariables.map(d=>this.props.store.getById(d).name),true);
        this.props.closeAddModal();
    }


    render() {
        return (
            <Modal bsSize={"large"}
                backdrop={"static"}
                   show={this.props.addModalIsOpen}
                   onHide={this.props.closeAddModal}>
                <Modal.Header closeButton >
                    <Modal.Title>Variable Manager</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
                        <Tab eventKey={1} title="Timepoint Variables">
                            <AddTimepointVarTab {...this.props}
                                                currentVariables={this.props.store.currentVariables}
                                                referencedVariables={this.props.store.referencedVariables}
                                                selectedVariables={this.state.timepoint.selectedVariables}
                                                originalVariables={this.state.timepoint.originalVariables}
                                                modifiedVariables={this.state.timepoint.modifiedVariables}
                                                setTimepointData={this.setTimepointData}/>
                        </Tab>
                        <Tab eventKey={2} title="Event Variables">
                            Tab 2 content
                        </Tab>
                    </Tabs>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.closeAddModal}>
                        Close
                    </Button>
                    <Button disabled={true}>
                        Combine selected
                    </Button>
                    <Button onClick={this.handleAddButton}>
                        Apply changes
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
/*
<Col sm={3}>
                        <p> C: Categorical </p>
                        <p> O: Ordinal </p>
                        <p> N: Numerical </p>
                        <p> B: Binary </p>
                    </Col>
 */
export default AddVarModal;
