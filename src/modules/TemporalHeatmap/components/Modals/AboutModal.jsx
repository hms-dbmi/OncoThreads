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
                    <Modal.Title>OncoThreads</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    
                    <h4>About the Tool</h4>
                    <p>
                        OncoThreads is a web-based visualization tool for the interactive exploration of tumor evolution data.
                       
                        OncoThreads allows researchers find patterns such as effect of treatments, find correlation with
                        treatments and mutation counts, and compare the results across patient cohorts.
                    </p>    

                        
                    <a href="http://gehlenborglab.org/research/projects/oncothreads/" //target="_blank"
                    > Learn more</a>
                  



                    <br></br>


                    <h4>Team Members</h4>
                    <p>
                    Developers: Theresa Harbig, Sabrina Nusrat

                    </p>
                    <p>
                    Project Management, and Advising: Nils Gehlenborg, Tali Mazor, Ethan Cerami
                    </p>

                    <br></br>
                    <h4>Institutes</h4>
                    <p>
                    Harvard Medical School
                    </p>
                    <p>
                    Dana-Farber Cancer Institute
                    </p>
                    <p>
                    Novartis Institutes for BioMedical Research 
                    </p>


                   
                    <br></br>

                    <h4>Funding</h4>
                    <p>
                    
                    Dana-Farber Cancer Institute, Novartis Institutes for BioMedical Research 
                   
                    </p>


                   <br></br>


                   <h4>Download</h4>
                    <a href="https://github.com/hms-dbmi/OncoThreads" //target="_blank"
                    > Github</a>
                  



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
