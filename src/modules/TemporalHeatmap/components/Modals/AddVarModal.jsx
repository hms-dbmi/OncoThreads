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
        };

        this.handleCheckBoxClick = this.handleCheckBoxClick.bind(this);

        this.addVariable = this.addVariable.bind(this);
        this.handleVariableClick = this.handleVariableClick.bind(this);
        this.handleAddButton = this.handleAddButton.bind(this);

        this.handleContinousClick = this.handleContinousClick.bind(this);
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
            //this.props.store.addOriginalVariable(id,variable,type,description,[],true,this.props.store.rootStore.staticMappers[id]);
    
            this.props.store.timepointStore.variableStores.sample.addOriginalVariable(id,variable,type,description,[],true,this.props.store.rootStore.staticMappers[id]);
    }


      /**
     * handles a click on one of the continuous Variables
     * @param id
     * @param variable
     */
    handleContinousClick(id, variable) {
        this.handleVariableClick(id, variable, "NUMBER")
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

            this.addVariable(id, variable, type, description);
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


        const _self=this;

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
                              onChange={(e) => this.handleCheckBoxClick(e, input.value.id, index)}
                              >{input.value.variable}
                              </Checkbox>
            </Col>


             <Col sm={1}>

                    {input.value.datatype==="STRING"? 'C': 'N'}
            </Col>

            <Col sm={1} >

                {input.value.datatype==="STRING"? '':
                    (<FontAwesome
                    onClick={
                        () => {
                            console.log(input);  
                            _self.handleCheckBoxClick("", input.value, index)

                            _self.handleContinousClick(input.id, input.value)
                            _self.props.updateVariable(input.id);
                            //_self.props.openBinningModal(input.id, "sample", this.props.store.rootStore.timepointStore.regroupTimepoints, null);

                            _self.props.openBinningModal(input.id, "sample", this.props.store.timepointStore.regroupTimepoints, null);

                            
                        }
                    } 
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
                        options={list}
                        onChange={opt => this.handleVariableClick(opt.id, opt.value, opt.datatype, opt.description)}
                    />
                    {list.map((detailedVar, ind) => this.renderInput(detailedVar, ind))}


                {  this.props.store.cbioAPI.mutationCounts.length!==0 ?
                
                <div> 
               
                <h3> Genomic Features  </h3>  
                    {mutList.map((detailedVar, ind) => this.renderInput(detailedVar, ind+list.length))}

                </div>  
                : ''}

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
            .forEach(detailedVar => this.handleVariableClick(detailedVar.id, detailedVar.variable, detailedVar.datatype, detailedVar.description));
        if(this.state.isChecked[this.props.varList.length]) {
            this.handleVariableClick(this.props.store.mutationCountId, "Mutation Count", "NUMBER");
        }
        this.props.closeAddModal();
    }

    render() {

        var mutList=[{label: 'Mutation Count',value:{id:this.props.store.mutationCountId,datatype: 'NUMBER',variable:"Mutation Count"}}];
        let clinList=[];
        this.props.varList.forEach(d=>clinList.push({value:d,label:d.variable}));
        //console.log(this.props.varList);

        var vNames=this.props.varList.map(d=>{return {value: d.value, type: d.datatype, id: d.id}; });

        console.log(vNames);
        //vNames = vNames.concat(mutList);

       //this.state.isChecked=vNames.map(d=>false).concat(false); //working, with warning

       let isCheckedTemp=this.state.isChecked;

       console.log(isCheckedTemp);
       //console.log(this.state.isChecked);

       isCheckedTemp=clinList.map(d=>false).concat(false);


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



               {this.renderList(clinList, mutList) }



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
