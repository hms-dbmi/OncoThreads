import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { Modal, Radio } from 'react-bootstrap';
//import TimeAssign from './TimeAssign';

const TimeVarModal = observer(class TimeVarModal extends React.Component {
    constructor(props) {
        super(props);
        this.width = 450;
        this.height = 200;
       
        this.handleClick = this.handleClick.bind(this);
        this.close = this.close.bind(this);

        //this.ts=new TimeAssign();
    }

    /**
     * closes Modal
     */
    close() {
        this.props.closeModal();
    }   

    handleClick(id, value) {
        this.props.rootStore.setTimeData(id,value)
    }


    render() {
       
        return (
            <Modal
                bsSize="small"
               
                show={this.props.modalIsOpen}
                onHide={this.close}
                aria-labelledby="example-modal-sizes-title-sm"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-sm">Show time as</Modal.Title>
                </Modal.Header>
                <Modal.Body>                 

                    <div
                    className="menu">
                    <Radio name="groupOptions" onClick={e => this.handleClick("1", "Days")}>Days</Radio>
                    <Radio name="groupOptions" onClick={e => this.handleClick("30", "Months")}>Months</Radio>
                    <Radio name="groupOptions" onClick={e => this.handleClick("365", "Years")}>Years</Radio>
                </div>
                </Modal.Body>
                
            </Modal>
        );
    }
});


TimeVarModal.propTypes = {
    modalIsOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
};
export default TimeVarModal;
