import React from 'react';
import {observer} from 'mobx-react';
import {Button, Modal} from 'react-bootstrap';
import FormGroup from "react-bootstrap/es/FormGroup";
import Radio from "react-bootstrap/es/Radio";


const SettingsModal = observer(class SettingsModal extends React.Component {


    handleContiuousRepresentationSetting(type){
        this.props.store.continuousRepresentation=type;
    }
    handleSelectionSetting(advanced){
        this.props.store.advancedSelection=advanced;
    }
    handleApply(){
        this.props.store.continuousRepresentation=this.continuousRepresentation;
        this.props.close();
    }
    render() {
        let gradient=false;
        let boxplot=false;
        let median=false;
        if(this.props.store.continuousRepresentation==="gradient"){
            gradient=true;
        }
        else if(this.props.store.continuousRepresentation==="boxplot"){
            boxplot=true;
        }
        else{
            median=true;
        }
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{'maxHeight': '400px', 'overflowY': 'auto'}}>
                    <form>
                        <FormGroup>
                            <h5>Show continuous variable distributions in groups as</h5>
                            <Radio checked={gradient} name="radioGroup" inline onChange={()=>this.handleContiuousRepresentationSetting('gradient')}>
                                Color Gradients
                            </Radio>{' '}
                            <Radio checked={boxplot} name="radioGroup" inline onChange={()=>this.handleContiuousRepresentationSetting('boxplot')}>
                                Boxplots
                            </Radio>{' '}
                            <Radio checked={median} name="radioGroup" inline onChange={()=>this.handleContiuousRepresentationSetting('median')}>
                                Median Color
                            </Radio>
                        </FormGroup>
                    </form>
                    <form>
                          <FormGroup>
                            <h5>Selection Type</h5>
                            <Radio checked={this.props.store.advancedSelection} name="radioGroup" inline onChange={()=>this.handleSelectionSetting(true)}>
                                Advanced
                            </Radio>{' '}
                            <Radio checked={!this.props.store.advancedSelection} name="radioGroup" inline onChange={()=>this.handleSelectionSetting(false)}>
                                Simplified
                            </Radio>{' '}
                        </FormGroup>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.close}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default SettingsModal;