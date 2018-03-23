import React from "react";
import Modal from 'react-modal';
import {observer} from "mobx-react";
import * as d3 from "d3";

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
                height: '500px', // <-- This sets the height
        transform: 'translate(-50%, -50%)',
                overlfow: 'scroll' // <-- This tells the modal to scrol
    }
};
const ChooseEvent = observer(class ChooseEvent extends React.Component {
    constructor() {
        super();
        this.state = {
            modalIsOpen: false,
            buttonClicked: "",
            selected: [],
            activeEvents: []
        };
        this.color =d3.scaleOrdinal().range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33']);

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

    isSelected(key, value) {
        let selected = false;
        this.state.selected.forEach(function (d, i) {
            if (d.key === key && d.value === value) {
                selected = true;
            }
        });
        return selected;
    }

    isChecked(value) {
        let isChecked = false;
        if (this.state.activeEvents.includes(value)) {
            isChecked = true
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

    getEventSelection() {
        let eventSelectors = [];
        for (let event in this.props.eventStore.attributes) {
            if(event!=="SPECIMEN") {
                eventSelectors.push(<g key={"choose"+event}><label  style={{backgroundColor: this.color(event)}}>{event}<input type="checkbox"
                                                                                                    checked={this.isChecked(event)}
                                                                                                    className="checkBox"
                                                                                                    value={event}
                                                                                                    onChange={this.handleCheckBoxClick}/></label>
                    <button value={event} onClick={this.openModal}>Filter</button>
                </g>)
            }
        }
        return(eventSelectors);
    }

    afterOpenModal() {
        // references are now sync'd and can be accessed.
        this.subtitle.style.color = '#f00';
    }

    closeModal() {
        this.setState({modalIsOpen: false, buttonClicked: "", selected: []});
    }


    handleCheckBoxClick(event) {
        const color = this.color(event.target.value);
        if (event.target.checked) {
            this.setState({activeEvents: [...this.state.activeEvents, event.target.value]});
            this.props.eventStore.addEvents(event.target.value, [], color);
        }
        else {
            let activeEvents = this.state.activeEvents.slice();
            activeEvents = activeEvents.filter(function (d, i) {
                return d !== event.target.value;
            });
            this.setState({activeEvents: activeEvents});
            this.props.eventStore.removeEvents(event.target.value);
        }
    }

    changeEvents() {
        this.setState({activeEvents: [...this.state.activeEvents, this.state.buttonClicked]});
        this.props.eventStore.removeEvents(this.state.buttonClicked);
        this.props.eventStore.addEvents(this.state.buttonClicked, this.state.selected, this.color(this.state.buttonClicked));
        this.closeModal();
    }

    render() {
        Modal.setAppElement('body');
        return (
            <div>
                {this.getEventSelection()}
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
