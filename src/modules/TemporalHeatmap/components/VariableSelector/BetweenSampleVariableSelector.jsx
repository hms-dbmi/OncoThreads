import React from "react";
import {observer} from "mobx-react";
import Modal from 'react-modal';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        height: '350px', // <-- This sets the height
        width: '300px',
        transform: 'translate(-50%, -50%)',
        overlfow: 'scroll' // <-- This tells the modal to scrol
    }
};
const BetweenSampleVariableSelector = observer(class BetweenSampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            modalIsOpen: false,
            buttonClicked: "",
            selectedKey:"",
            name:"",
            selectedValues:[]
        };
        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    openModal(event) {
        this.setState({modalIsOpen: true, buttonClicked: event.target.value});
    }
    addVariable() {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(this.state.name);
        }
        this.props.store.addVariable(this.state.buttonClicked,this.state.selectedValues,this.state.selectedKey,this.state.name);
    }
    handleCheckBoxClick(event,type,value){
        let selected = this.state.selectedValues.slice();
        if(event.target.checked) {
                selected.push(value);
        }
        else{
             let index=selected.indexOf(value);
            selected.splice(index,1);
        }
         this.setState({
             selectedValues:selected,
             selectedKey:type
            });
    }
    createCheckboxes(event) {
        let elements = [];
        const _self = this;
        const attributes = this.props.eventAttributes[event];
        for (let key in attributes) {
            elements.push(<h4>{key}</h4>);
            attributes[key].forEach(function (d, i) {
                elements.push(<p><input type="checkbox" onClick={(e)=>_self.handleCheckBoxClick(e,key,d)}/>{d}</p>)
            })
        }
        return elements;
    }

    createTransitionsList() {
        let buttons = [];
        const _self = this;
        this.props.eventCategories.forEach(function (d) {
            if (d !== "SPECIMEN") {
                buttons.push(<button value={d} onClick={_self.openModal} className="notSelected" key={d}>{d}</button>)
            }
        });
        return buttons;
    }
    handleNameChange(event){
        this.setState({
            name:event.target.value
        })
    }

    afterOpenModal() {
        // references are now sync'd and can be accessed.
        this.subtitle.style.color = '#f00';
    }

    closeModal() {
        this.setState({modalIsOpen: false, buttonClicked: "", selectedValues: []});
    }

    render() {
        return (
            <div>
                <h4>Transition variables</h4>
                <div className={"btn-group"}>
                    {this.createTransitionsList()}
                </div>
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.afterOpenModal}
                    onRequestClose={this.closeModal}
                    style={customStyles}
                    contentLabel="Add Transition Data"
                >
                    <h2 ref={subtitle => this.subtitle = subtitle}>Add Transition Data</h2>
                    <div>
                        {this.createCheckboxes(this.state.buttonClicked)}
                    </div>
                    <br/>
                    <input type="text" onChange={(e)=>this.handleNameChange(e)} defaultValue="Name"/>
                        <br/>
                    <button onClick={()=>this.addVariable()}>Add</button>
                    <button onClick={this.closeModal}>Close</button>
                </Modal>
            </div>
        )
    }
});
export default BetweenSampleVariableSelector;