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
                    <p>

                        ThreadStates is a tool for the visualization of longitudinal cancer genomics data in patient cohorts. 
                        The tool visualizes patient cohorts as temporal heatmaps that can be iteratively transformed into Sankey diagrams. 
                        ThreadStates supports the interactive exploration and ranking of a wide range of clinical and genomic features. 
                    </p>    

                        
                    <a href="http://gehlenborglab.org/research/projects/oncothreads/" //target="_blank"
                    > Learn more</a>
                  



                    <br></br>


                    <h4>Team</h4>
                    <p>
                    Qianwen Wang, Harvard Medical School
                    <br/>
                    Theresa Harbig, Harvard Medical School
                    <br/>
                    Sabrina Nusrat, Harvard Medical School
                    <br/>
                    Nils Gehlenborg, Harvard Medical School
                    <br/>
                    Tali Mazor, Dana-Farber Cancer Institute
                    <br/>
                    Ethan Cerami, Dana-Farber Cancer Institute
                    <br/>
                    Alexander Thomson, Novartis Institutes for BioMedical Research 
                    <br/>
                    Hans Bitter, Novartis Institutes for BioMedical Research
                    <br/>
                    Audrey Kauffmann, Novartis Institutes for BioMedical Research
                    </p>

                    
                   
                    <br></br>

                    <h4>Funding</h4>
                    <p>
                    
                    ThreadStates is supported by the grant 'Drug Discovery & Translational Research Program' from Novartis/DFCI and the US National Institutes of Health (R00 HG007583).
                   
                    </p>


                   <br></br>


                   <h4>Software and Download</h4>
                    <a href="https://github.com/hms-dbmi/OncoThreads/tree/ThreadStates" //target="_blank"
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
