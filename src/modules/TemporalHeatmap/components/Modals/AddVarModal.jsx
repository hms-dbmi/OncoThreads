import React from 'react';
import {observer} from 'mobx-react';
import {Row, Col, Button, Modal, Label, Checkbox} from 'react-bootstrap';

import FontAwesome from 'react-fontawesome';

import {FormControl, FormGroup, ControlLabel} from 'react-bootstrap';


const AddVarModal = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
    
        this.state = {
          isChecked: true
        }
    
        this.handleCheckBoxClick = this.handleCheckBoxClick.bind(this);
    }


    setCh(varList){

        console.log(varList);
    }
    /*handleCheckBoxChange(e) {
        const item = e.target.name;

        console.log(item);

       // this.state.isChecked = !this.state.isChecked;

       e.target.checked=!e.target.checked
        
    }*/


    handleCheckBoxClick(event, type, variable) {
        /*let selected = this.state.selectedValues.slice();
        if (event.target.checked) {
            selected.push(variable);
            this.setState({showEmptySelectionAlert: false});
        }
        else {
            let index = selected.map(function (d) {
                return d.id
            }).indexOf(variable.id);
            selected.splice(index, 1);
        }
        let disabled = Object.assign({}, this.state.disabled);
        if (this.state.addCombined) {
            if (selected.length > 0) {
                for (let k in disabled) {
                    if (k !== type) {
                        disabled[k] = true;
                    }
                }
            }
            else {
                for (let k in disabled) {
                    disabled[k] = false;
                }
            }
        }
        this.setState({
            selectedValues: selected,
            selectedKey: type,
            disabled: disabled,
            defaultName: this.createCompositeName(selected)
        });*/
    }

    renderInput = (input) => {
        // element index as key or reference is a horrible idea
        // for example if a new input is unshifted it will have the same 
        // reference or key, which will render the idea of key, reference invalid
      
        let isSelected=false;
        return (


        /*  <Input 
            id={input.id} 
            key={input.id} 
            ref={input.id} 
            type={input.type} 
            placeholder={input.placeholder} 
          /> */

        <form>
            <FormGroup>
            <Row>     
            
           
         

            <Col sm={9} key={"Bin2" +  "input"}>  
            
           
            <Checkbox disabled={false} checked={isSelected}
                              onChange={(e) => this.handleCheckBoxClick(e, 0, input)}
                              >{input}
                              </Checkbox>
            </Col>


             <Col sm={1} key={"Bin" +  "input"}>

                    c 
            </Col>

            <Col sm={1} key={"Bin" +  "input"}>

                <FontAwesome
                //onClick={() => this.bin(this.props.store.rootStore.mutationCountId)} 
                name="cog"/> 
            </Col>


          
            
            </Row>
            </FormGroup>
       
        </form>

        );
        

       /*return (
 
       <li>
            {input}
        </li>

        );*/
        //console.log(input);
      }

    renderList(list, mutList){
       // var mutList=['Mutation Count'];
        return (
            <form>

                <FormGroup>
                <Row>

                
                <Col sm={9} style={{'maxHeight': '400px', 'overflowY': 'scroll'}}>      

                <label> Clinical Features </label>

                    {list.map(this.renderInput)}


                <label> Genomic Features  </label>  
                    {mutList.map(this.renderInput)}
                    

                </Col>

                <Col  sm={3}>

                
                   <p> C: Categorical </p>
                    
                   <p> O: Ordinal </p>

                   <p> N: Numerical </p>
                    
                   <p> B: Binary </p>

            
                </Col>
                </Row>
                </FormGroup>


           


            </form>
    
        )
    }  

    render() {
       
        var mutList=['Mutation Count'];
        return (
            <Modal
                show={this.props.addModalIsOpen}
                onHide={this.props.closeAddModal}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Variables</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{'maxHeight': '400px', 'overflowY': 'auto'}}>
               
                

               {this.renderList(this.props.varList, mutList) }

                

                </Modal.Body>
                <Modal.Footer>
                    <Button //onClick={this.props.closeAddModal}
                    >
                        Add
                    </Button>

                    <Button //onClick={this.props.closeAddModal}
                    >
                        Combine
                    </Button>

                    <Button onClick={this.props.closeAddModal}
                    >
                        Close
                    
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default AddVarModal;

// <Modal.Body style={{'maxHeight': '400px', 'overflowY': 'auto'}}>

//{ this.props.varList.map(this.renderInput) }

/*

 <input

                type="checkbox" 
               

                name={input}
                type="checkbox"
                checked={false}
                onChange={this.handleCheckBoxChange} 
             />
*/
