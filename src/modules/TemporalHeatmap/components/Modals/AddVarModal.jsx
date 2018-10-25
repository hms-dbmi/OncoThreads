import React from 'react';
import {observer} from 'mobx-react';
import {Row, Col, Button, Modal, Checkbox, FormGroup} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';

import Select from 'react-select';

//import SampleVariableSelector from "../VariableSelector/SampleVariableSelector"


const AddVarModal = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
    
        this.state = {
          isChecked: []
        }
    
        this.handleCheckBoxClick = this.handleCheckBoxClick.bind(this);

        this.addVariable = this.addVariable.bind(this);
        this.handleVariableClick = this.handleVariableClick.bind(this);
        this.handleAddButton = this.handleAddButton.bind(this);
    }


    setCh(varList){

       // console.log(varList);
    }
    /*handleCheckBoxChange(e) {
        const item = e.target.name;

        console.log(item);

       // this.state.isChecked = !this.state.isChecked;

       e.target.checked=!e.target.checked
        
    }*/


     /**
     * adds a variable to the view
     * @param id
     * @param variable
     * @param type
     * @param description
     */
    addVariable(id, variable, type, description) {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(id, variable, type, description);
        }
        else {
            this.props.store.addVariable(id, variable, type, description);
        }
    }


    /**
     * handles a click on one of the categorical Variables
     * @param id
     * @param variable
     * @param type
     * @param description
     */
    handleVariableClick(id, variable, type, description) {
        this.props.hideTooltip();
        if (!(this.props.currentVariables.map(function (d) {
            return d.id
        }).includes(id))) {
            this.addVariable(id, variable, type, description);
        }
    }


    handleCheckBoxClick(event, variable, ind1, sel) {

        //console.log(ind1);

        let isCheckedTemp=this.state.isChecked; //.slice();

        //console.log(isCheckedTemp);
        //console.log(this.state.isChecked);

        isCheckedTemp[ind1]=!this.state.isChecked[ind1];


        //console.log(isCheckedTemp);
        //console.log(this.state.isChecked);

        //this.state.isChecked[ind1] = !this.state.isChecked[ind1];


    }

    renderInput(input, index){
      
        //let isSelected=false;

        /*var mutList=['Mutation Count'];

        var vNames=this.props.varList.map(d=>d.value);

        vNames.push(mutList);

        var ind1=vNames.indexOf(input);*/


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
            
           
         

            <Col sm={9} >  
            
           
            <Checkbox disabled={false}
                              onChange={(e) => this.handleCheckBoxClick(e, input.value, index)}
                              >{input.value}
                              </Checkbox>
            </Col>


             <Col sm={1}>

                    {input.type==="STRING"? 'C': 'N'} 
            </Col>

            <Col sm={1} >

                {input.type==="STRING"? '': 
                    (<FontAwesome
                    //onClick={() => this.bin(this.props.store.rootStore.mutationCountId)} 
                    name="cog"/> )
            
                } 
                
            </Col>


          
            
            </Row>
            </FormGroup>
       
        </form>

        );
        

     
      }

    renderList(list, mutList){
       // var mutList=['Mutation Count'];
        return (
            <form>

                <FormGroup>
                <Row>

                
                <Col sm={9} style={{'maxHeight': '400px', 'overflowY': 'scroll'}}>      

                <h3> Clinical Features </h3>

                <Select
                        type="text"
                        searchable={true}
                        componentClass="select" placeholder="Select..."
                        searchPlaceholder="Search variable"
                        options={this.props.varList}
                        onChange={opt => this.handleVariableClick(opt.id, opt.value, opt.datatype, opt.description)}
                    />
                    {list.map((detailedVar, ind) => this.renderInput(detailedVar, ind))}


                <h3> Genomic Features  </h3>  
                    {mutList.map((detailedVar, ind) => this.renderInput(detailedVar, ind+list.length))}
                    

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

    handleAddButton() {
        this.props.varList.filter((detailedVar, ind) => this.state.isChecked[ind])
            .forEach(detailedVar => this.handleVariableClick(detailedVar.id, detailedVar.value, detailedVar.datatype, detailedVar.description));
        if(this.state.isChecked[this.props.varList.length]) {
            this.handleVariableClick(this.props.store.rootStore.mutationCountId, "Mutation Count", "NUMBER");
        }
        this.props.closeAddModal();
    }

    render() {
       
        var mutList=[{value: 'Mutation Count', type: 'NUMBER'}];

        //console.log(this.props.varList);

        var vNames=this.props.varList.map(d=>{return {value: d.value, type: d.datatype}; });

        //vNames = vNames.concat(mutList);

       //this.state.isChecked=vNames.map(d=>false).concat(false); //working, with warning

       let isCheckedTemp=this.state.isChecked; 

       console.log(isCheckedTemp);
       //console.log(this.state.isChecked);

       isCheckedTemp=vNames.map(d=>false).concat(false);


       console.log(isCheckedTemp);
       //console.log(this.state.isChecked);

       // this.setState({isChecked: vNames.map(d=>false).concat(false)});

        //this.state.isChecked.push(false); //for mutation count


        return (
            <Modal
                show={this.props.addModalIsOpen}
                onHide={this.props.closeAddModal}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Variables</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{'maxHeight': '400px', 'overflowY': 'auto'}}>
               
                

               {this.renderList(vNames, mutList) }

                

                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleAddButton}
                    >
                        Add
                    </Button>

                    <Button disabled={true}//onClick={this.props.closeAddModal}
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
