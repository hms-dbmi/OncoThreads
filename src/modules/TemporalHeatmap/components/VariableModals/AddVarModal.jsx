import React from 'react';
import {observer} from 'mobx-react';
import {Button, Modal, Tab, Tabs} from 'react-bootstrap';
import AddTimepointVarTab from "./AddTimepointVarTab"


const AddVarModal = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            timepoint: {selectedVariables: [], originalVariables: [], modifiedVariables: []},
            eventData: []
        };
        this.setTimepointData = this.setTimepointData.bind(this);
        this.changeRange = this.changeRange.bind(this);
        this.handleAddButton = this.handleAddButton.bind(this);
    }

    setTimepointData(selectedVariables, originalVariables, modifiedVariables) {
        this.setState({
            timepoint: {
                selectedVariables: selectedVariables,
                originalVariables: originalVariables,
                modifiedVariables: modifiedVariables,
            }
        })
    }

    changeRange(range, variableId) {
        let originalVariables = this.state.timepoint.originalVariables.slice();
        originalVariables[this.state.timepoint.originalVariables.map(d => d.id).indexOf(variableId)].range = range;
        this.setState({
            timepoint: {
                selectedVariables: this.state.timepoint.selectedVariables,
                modifiedVariables: this.state.timepoint.modifiedVariables,
                originalVariables: originalVariables
            }
        })
    }

    /**
     * handles clicking the add button
     */
    handleAddButton() {
        const _self = this;
        this.state.timepoint.selectedVariables.forEach(d => {
            if (!d.modified) {
                _self.props.store.addVariableToBeDisplayed(this.state.timepoint.originalVariables.filter(f => f.id === d.id)[0]);
            }
            else {
                _self.props.store.addVariableToBeReferenced(this.state.timepoint.originalVariables.filter(f => f.id === d.originalId)[0]);
            }
        });
        this.state.timepoint.modifiedVariables.forEach(d => this.props.store.addVariableToBeDisplayed(d));
        this.props.store.rootStore.undoRedoStore.saveVariableHistory("ADD",this.state.timepoint.selectedVariables.map(d=>{
            if(d.modified){
                return this.state.timepoint.modifiedVariables.filter(f=>f.id===d.id)[0].name;
            }
            else{
                return this.state.timepoint.originalVariables.filter(f=>f.id===d.id)[0].name;
            }
        }),true);
        this.props.closeAddModal();
    }


    render() {
        return (
            <Modal backdrop={"static"}
                   show={this.props.addModalIsOpen}
                   onHide={this.props.closeAddModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Create custom variables</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{minHeight: "400px"}}>
                    <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
                        <Tab eventKey={1} title="Timepoint Variables">
                            <AddTimepointVarTab {...this.props}
                                                selectedVariables={this.state.timepoint.selectedVariables}
                                                originalVariables={this.state.timepoint.originalVariables}
                                                modifiedVariables={this.state.timepoint.modifiedVariables}
                                                setTimepointData={this.setTimepointData}
                                                changeRange={this.changeRange}/>
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
                        Add all
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
