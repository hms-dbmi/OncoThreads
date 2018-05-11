import React from "react";
import {observer} from "mobx-react";
import Modal from 'react-modal';
import ReactDOM from 'react-dom';
import FontAwesome from 'react-fontawesome';



const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        height: '400px', // <-- This sets the height
        width: '400px',
        transform: 'translate(-50%, -50%)',
        overlfow: 'scroll' // <-- This tells the modal to scrol
    }
};
/*
creates the selector for between variables (left side of main view, bottom)
TODO: implement removing variables
 */
const BetweenSampleVariableSelector = observer(class BetweenSampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            modalIsOpen: false,
            buttonClicked: "",
            selectedKey: "",
            name: "",
            selectedValues: [],
            defaultValue:""
        };
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    openModal(event) {
        this.setState({modalIsOpen: true, buttonClicked: event.target.value, selectedKey: "", selectedValues: []});
    }

    /**
     * adds a variable to the view
     */
    addVariable() {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(this.state.name);
        }
        this.props.store.addVariable(this.state.buttonClicked, this.state.selectedValues, this.state.selectedKey, this.state.name);
        this.closeModal();
    }

    /**
     * handles the click on one of the checkboxes
     * @param event
     * @param type
     * @param value
     */
    handleCheckBoxClick(event, type, value) {
        let selected = this.state.selectedValues.slice();
        if (event.target.checked) {
            selected.push(value);
        }
        else {
            let index = selected.indexOf(value);
            selected.splice(index, 1);
        }
        this.setState({
            defaultValue:value,
            selectedValues: selected,
            selectedKey: type
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
            elements.push(<h5 key={key}>{key}</h5>);
            attributes[key].forEach(function (d) {
                elements.push(<div style={{marginLeft:"20px"}} className="form-group" key={d}>
                    <input id={d} type="checkbox" className="form-check-input" onClick={(e) => _self.handleCheckBoxClick(e, key, d)}/>
                    <label className="form-check-label" for={d}>{d}</label>
                </div>)
            })
        }
        return elements;
    }

    static toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
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
                buttons.push(<button value={d} onClick={_self.openModal} className="btn"
                                     key={d}>{BetweenSampleVariableSelector.toTitleCase(d)} <FontAwesome name="plus"/></button>)
            }
        });
        return buttons;
    }

    /**
     * updates state when the name of the textfield is changed
     * @param event
     */
    handleNameChange(event) {
        this.setState({
            name: event.target.value
        })
    }

    closeModal() {
        this.setState({modalIsOpen: false, buttonClicked: "", selectedValues: [], selectedKey: "",name:""});
    }

    componentDidMount() {
        Modal.setAppElement(ReactDOM.findDOMNode(this));
    }

    render() {
        return (
            <div className="mt-2">
                <h5>Transition variables</h5>
                <div className={"btn-group-vertical btn-block"}>
                    {this.createBetweenVariablesList()}
                </div>
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.afterOpenModal}
                    onRequestClose={this.closeModal}
                    style={customStyles}
                    contentLabel="Add Transition Data"
                >
                    <div className="form-group">
                        {this.createCheckboxes(this.state.buttonClicked)}
                    </div>
                    <br/>
                    <label for="name">New variable name</label>
                    <input type="text" className="form-control" id="name" onChange={(e) => this.handleNameChange(e)}/>
                    <br/>
                    <button type="button" className="btn" onClick={() => this.addVariable()}>Add</button>
                    <button type="button" className="btn ml-3" onClick={this.closeModal}>Close</button>
                </Modal>
            </div>
        )
    }
});
export default BetweenSampleVariableSelector;