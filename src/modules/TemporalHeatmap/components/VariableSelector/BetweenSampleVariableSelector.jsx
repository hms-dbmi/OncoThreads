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
/*
creates the selector for between variables (left side of main view, bottom)
 */
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

    /**
     * adds a variable to the view
     */
    addVariable() {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(this.state.name);
        }
        this.props.store.addVariable(this.state.buttonClicked,this.state.selectedValues,this.state.selectedKey,this.state.name);
    }

    /**
     * handles the click on one of the checkboxes
     * @param event
     * @param type
     * @param value
     */
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

    /**
     * creates checkboxes for the different event types in modal window
     * @param event
     * @returns {Array}
     */
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

    /**
     * creates the buttons for the variables for the betweenTimepoints
     * @returns {Array}
     */
    createBetweenVariablesList() {
        let buttons = [];
        const _self = this;
        this.props.eventCategories.forEach(function (d) {
            if (d !== "SPECIMEN") {
                buttons.push(<button value={d} onClick={_self.openModal} className="notSelected" key={d}>{d}</button>)
            }
        });
        return buttons;
    }

    /**
     * updates state when the name of the textfield is changed
     * @param event
     */
    handleNameChange(event){
        this.setState({
            name:event.target.value
        })
    }

    afterOpenModal() {
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
                    {this.createBetweenVariablesList()}
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