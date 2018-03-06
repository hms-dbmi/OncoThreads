import React from "react";
import Modal from 'react-modal';
import {observer} from "mobx-react";

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)'
    }
};
const ChooseEvent = observer(class ChooseEvent extends React.Component {
    constructor() {
        super();
        this.state = {
            modalIsOpen: false,
            buttonClicked: "",
            selected: [],
            activeEvents:[]
        };

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleCheckBoxClick = this.handleCheckBoxClick.bind(this);
        this.select = this.select.bind(this);
        this.changeEvents = this.changeEvents.bind(this);
    }

    openModal(event) {
        this.setState({modalIsOpen: true, buttonClicked: event.target.value});
    }

    select(event, key, value) {
        if (event.target.checked) {
            this.setState({selected: [...this.state.selected, {key: key, value: value}]});
        }
        else {
            let selected = this.state.selected.slice();
            selected.filter(function (d, i) {
                return !(d.value === value && d.key === key);
            });
            this.setState({selected: selected});

        }
    }
    isSelected(key,value){
        let selected=false;
        this.state.selected.forEach(function (d, i) {
            if(d.key===key && d.value ===value){
                selected=true;
            }
        });
        return selected;
    }
    isChecked(value){
        let isChecked=false;
        if(this.state.activeEvents.includes(value)){
            isChecked=true
        }
        return isChecked;
    }
    getAttributes(event) {
        let elements = [];
        const _self = this;
        const attributes = this.props.eventStore.attributes[event];
        for (let key in attributes) {
            elements.push(<h4>{key}</h4>);
            attributes[key].forEach(function (d, i) {
                elements.push(<p><input type="checkbox" onClick={(e) => _self.select(e, key, d)}/>{d}</p>)
            })
        }
        return elements;
    }

    afterOpenModal() {
        // references are now sync'd and can be accessed.
        this.subtitle.style.color = '#f00';
    }

    closeModal() {
        this.setState({modalIsOpen: false, buttonClicked: "", selected:[]});
    }

    static getColor(value) {
        let color = "";
        switch (value) {
            case "SURGERY":
                color = "green";
                break;
            case "STATUS":
                color = "grey";
                break;
            case "TREATMENT":
                color = "red";
                break;
            default:
                color = "black";
        }
        return color;
    }

    handleCheckBoxClick(event) {
        const color = ChooseEvent.getColor(event.target.value);
        if (event.target.checked) {
            this.setState({activeEvents:[...this.state.activeEvents,event.target.value]});
            this.props.eventStore.addEvents(event.target.value, [], color);
        }
        else {
            let activeEvents=this.state.activeEvents.slice();
            activeEvents=activeEvents.filter(function (d,i) {
                return d!==event.target.value;
            });
            this.setState({activeEvents:activeEvents});
            this.props.eventStore.removeEvents(event.target.value);
        }
    }
    changeEvents() {
        this.setState({activeEvents:[...this.state.activeEvents,this.state.buttonClicked]});
        this.props.eventStore.removeEvents(this.state.buttonClicked);
        this.props.eventStore.addEvents(this.state.buttonClicked, this.state.selected, ChooseEvent.getColor(this.state.buttonClicked));
        this.closeModal();
    }
    render() {
        Modal.setAppElement('body');
        return (
            <div>
                <label style={{backgroundColor: "lightgreen"}}>Surgery<input type="checkbox" checked={this.isChecked("SURGERY")} className="checkBox"
                                                                             value="SURGERY"
                                                                             onChange={this.handleCheckBoxClick}/></label>
                <button value="SURGERY" onClick={this.openModal}>Filter</button>
                <label style={{backgroundColor: "lightgrey"}}>Status<input type="checkbox" checked={this.isChecked("STATUS")} className="checkBox"
                                                                           value="STATUS"
                                                                           onChange={this.handleCheckBoxClick}/></label>
                <button value="STATUS" onClick={this.openModal}>Filter</button>
                <label style={{backgroundColor: "lightcoral"}}>Treatment<input type="checkbox" checked={this.isChecked("TREATMENT")} className="checkBox"
                                                                               value="TREATMENT"
                                                                               onChange={this.handleCheckBoxClick}/></label>
                <button value="TREATMENT" onClick={this.openModal}>Filter</button>
                <br/>
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.afterOpenModal}
                    onRequestClose={this.closeModal}
                    style={customStyles}
                    contentLabel="Filter"
                >
                    <h2 ref={subtitle => this.subtitle = subtitle}>Filter</h2>
                    <div>
                        {this.getAttributes(this.state.buttonClicked)}
                    </div>
                    <button onClick={this.changeEvents}>apply</button>
                    <button onClick={this.closeModal}>close</button>
                </Modal>
            </div>
        );
    }
});
export default ChooseEvent;
