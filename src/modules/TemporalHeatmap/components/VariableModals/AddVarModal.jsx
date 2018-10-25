import React from 'react';
import {observer} from 'mobx-react';
import {Button, Checkbox, Col, Label, Modal, Row} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';

import Select from 'react-select';

//import SampleVariableSelector from "../VariableSelector/SampleVariableSelector"


const AddVarModal = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isChecked: [],
            variableList: this.createVariableList()
        };

        this.handleCheckBoxClick = this.handleCheckBoxClick.bind(this);

        this.addVariable = this.addVariable.bind(this);
        this.addModified = this.addModified.bind(this);
        this.handleAddButton = this.handleAddButton.bind(this);
        this.bin = this.bin.bind(this);
    }

    createVariableList() {
        let variableList = [];
        this.props.varList.forEach(function (d) {
            variableList.push({label: d.variable, value: d, modified: false})
        });
        variableList.push({
            label: "Mutation Count",
            value: {id: this.props.store.rootStore.mutationCountId, datatype: "NUMBER", variable: "Mutation Count"},
            modified: false,
            checked: false
        });
        return variableList;
    }

    /**
     * creates a searchable list of clinical attributes
     * @returns {Array}
     */
    createOptions() {
        let options = [];
        const _self = this;
        this.state.variableList.forEach(function (d, i) {
            let icon = null;
            if (d.value.datatype === "NUMBER") {
                icon = <div className="floatDiv">
                    <FontAwesome
                        onClick={() => _self.bin(d.value.id, d.value.variable, d.value.description)
                        } name="cog"/>
                </div>
            }
            let lb = (
                <div onMouseEnter={(e) => {
                    _self.props.showTooltip(e, d.value.description);
                }} onMouseLeave={_self.props.hideTooltip}>
                    <div className="wordBreak" style={{textAlign: "left"}}
                         onClick={() => _self.handleCheckBoxClick(i)}
                         key={d.label}> {d.label}
                    </div>
                    {icon}
                </div>);
            options.push({value: d, label: lb})
        });
        return options;
    }

    /**
     * opens the binning modal
     * @param id
     * @param name
     * @param description
     */
    bin(id, name, description) {
        const _self = this;
        this.props.store.addOriginalVariable(id, name, "NUMBER", description, [], false, this.props.store.rootStore.staticMappers[id]);
        this.props.openBinningModal(id, "sample", false, false, function (newId) {
            let varList = _self.state.variableList;
            let newVar = _self.props.store.getById(newId);
            console.log(newVar);
            varList[varList.map(d => d.value.id).indexOf(id)].modified = true;
            varList[varList.map(d => d.value.id).indexOf(id)].value.datatype = newVar.datatype;
            varList[varList.map(d => d.value.id).indexOf(id)].value.name = newVar.name;
            varList[varList.map(d => d.value.id).indexOf(id)].label = newVar.name;
            varList[varList.map(d => d.value.id).indexOf(id)].value.id = newId;
            _self.setState({variableList: varList});
        });
    }


    /**
     * adds a variable to the view
     * @param id
     * @param variable
     * @param type
     * @param description
     */
    addVariable(id, variable, type, description) {
        this.props.store.addOriginalVariable(id, variable, type, description, [], true, this.props.store.rootStore.staticMappers[id]);
    }

    addModified(id) {
        this.props.store.addDerivedToCurrent(id);
    }


    handleCheckBoxClick(index) {

        //console.log(ind1);
        let variableList = this.state.variableList.slice();
        variableList[index].checked = !variableList[index].checked;
        this.setState({variableList: variableList});


    }

    renderInput(input, index) {
        let label = null;
        if (input.modified) {
            label = <Label bsStyle="warning">
                Modified
            </Label>
        }
        let datatypeLabel;
        switch (input.value.datatype) {
            case "STRING":
                datatypeLabel = "C";
                break;
            case "BINNED":
                datatypeLabel = "O";
                break;
            case "BINARY":
                datatypeLabel = "B";
                break;
            default:
                datatypeLabel = "N";
        }
        return (
            <div>
                <Row>
                    <Col sm={9} md={9}>
                        <Checkbox disabled={false}
                                  onChange={() => this.handleCheckBoxClick(index)}
                        >{input.value.variable}
                        </Checkbox>
                    </Col>
                    <Col sm={2} md={2}>
                        {datatypeLabel}
                        {label}
                    </Col>
                    <Col sm={1} md={1}>
                        {input.value.datatype === "NUMBER" ? (<FontAwesome
                            onClick={() => this.bin(input.value.id, input.value.variable, input.value.description)}
                            name="cog"/>) : ''
                        }
                    </Col>
                </Row>
            </div>


        );


    }

    renderList(list) {
        // var mutList=['Mutation Count'];
        return (
            <div>
                <Row>


                    <Col sm={9} style={{'maxHeight': '400px', 'overflowY': 'scroll'}}>

                        <h3>Features </h3>

                        <Select
                            type="text"
                            searchable={true}
                            componentClass="select" placeholder="Select..."
                            searchPlaceholder="Search variable"
                            options={this.createOptions()}
                            onChange={opt => this.handleVariableClick(opt.id, opt.value, opt.datatype, opt.description)}
                        />
                        {list.map((detailedVar, ind) => this.renderInput(detailedVar, ind))}


                    </Col>

                    <Col sm={3}>


                        <p> C: Categorical </p>

                        <p> O: Ordinal </p>

                        <p> N: Numerical </p>

                        <p> B: Binary </p>


                    </Col>
                </Row>
            </div>

        )
    }

    handleAddButton() {
        const _self = this;
        this.state.variableList.filter(d => d.checked).forEach(function (d) {
            if (!d.modified) {
                _self.addVariable(d.value.id, d.value.variable, d.value.datatype, d.value.description)
            } else {
                _self.addModified(d.value.id);
            }
        });
        this.props.closeAddModal();
    }

    render() {


        return (
            <Modal
                show={this.props.addModalIsOpen}
                onHide={this.props.closeAddModal}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Variables</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{'maxHeight': '400px', 'overflowY': 'auto'}}>


                    {this.renderList(this.state.variableList)}


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
