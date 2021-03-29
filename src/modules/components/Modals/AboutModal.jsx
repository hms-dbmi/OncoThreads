import React from 'react';
import { observer } from 'mobx-react';
import { Button, Modal } from 'react-bootstrap';
import PropTypes from 'prop-types'; // ES6


/**
 * Modal showing information about OncoThreads
 */
const AboutModal = observer(class AboutModal extends React.Component {
    render() {
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
            >
                <Modal.Header closeButton>
                    <Modal.Title>ThreadStates</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    
                    <h4>About</h4>
                    <p> ThreadStates is an interactive visual analytics tool for the exploration of longitudinal patient cohort data. 
                        The focus of ThreadStates is the identification of the states of disease progression by learning from repeated observation data in a human-in-the-loop manner. 
                        The disease progression patterns are then revealed in terms of state transitions.
                    </p>
                    <br/>


                    <h4>Team</h4>
                    <p>
                    Qianwen Wang, Harvard Medical School
                    <br/>
                    Tali Mazor, Dana-Farber Cancer Institute
                    <br/>
                    Theresa Harbig, Harvard Medical School
                    <br/>
                    Ethan Cerami, Dana-Farber Cancer Institute
                    <br/>
                    Nils Gehlenborg, Harvard Medical School
                    </p>

                    
                   
                    <br></br>

                    <h4>Funding</h4>
                    <p>
                    
                    ThreadStates is supported by the grant 'Drug Discovery & Translational Research Program' from Novartis/DFCI and the US National Institutes of Health (R00 HG007583).
                   
                    </p>


                   <br></br>


                   <h4>Software and Download</h4>
                    <a href="https://github.com/hms-dbmi/OncoThreads/tree/ThreadStates" target="_blank"> Github</a>
                  



                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.close}>Close</Button>
                </Modal.Footer>
            </Modal>
        );
    }
});

AboutModal.propTypes = {
    close: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
};
export default AboutModal;
