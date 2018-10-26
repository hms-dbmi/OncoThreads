import React from 'react';
import {observer} from 'mobx-react';
import {Button, Checkbox, ControlLabel, FormControl, Glyphicon, Modal, Table} from 'react-bootstrap';
import uuidv4 from "uuid/v4"

//import SampleVariableSelector from "../VariableSelector/SampleVariableSelector"


const ModifyCategorical = observer(class ModifyCategorical extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {currentData: this.createCurrentData(), name: props.store.referencedVariables[props.variable].name,ordinal:false};
        this.merge = this.merge.bind(this);
        this.handleNameChane=this.handleNameChane.bind(this);
        this.handleApply=this.handleApply.bind(this);
    }

    getPercentOccurences(mapper) {
        let occurences = {};
        this.state.currentData.forEach(function (d) {
            const mapEntry = d.categories.toString();
            occurences[mapEntry] = 0;
            d.categories.forEach(function (f) {
                for (let entry in mapper) {
                    if (mapper[entry] === f) {
                        occurences[mapEntry] += 1 / Object.keys(mapper).length * 100;
                    }
                }
            })
        });
        return occurences;
    }

    handleRenameCategory(index, e) {
        e.stopPropagation();
        let currentData = this.state.currentData.slice();
        currentData[index].name = e.target.value;
        this.setState({currentData: currentData});
    }
    handleNameChane(event){
        this.setState({name:event.taget.value});
    }
    handleConvertToOrdinal(event){
        if(event.target.checked){
            this.setState({ordinal:true})
        }
        else{
            this.setState({ordinal:false})
        }
    }
    handleApply(){
        let categoryMapping={};
        const _self=this;
        this.props.store.referencedVariables[this.props.variable].domain.forEach(function (d,i) {
            _self.state.currentData.forEach(function (f) {
                if(f.categories.includes(d)){
                    categoryMapping[d]=f.name;
                }
            });
        });
        let newId=uuidv4();
        let datatype=this.state.ordinal?"ORDINAL":"STRING";
        this.props.store.addDerivedVariable(newId,this.state.name,datatype, this.props.store.referencedVariables[this.props.variable].description, [this.props.store.referencedVariables[this.props.variable].id],"modifyCategorical",categoryMapping,false)
        this.props.callback(newId);
        this.props.closeModal();
    }

    createCurrentData() {
        let currentData = [];
        const variable = this.props.store.referencedVariables[this.props.variable];
        variable.domain.forEach(d => currentData.push({
            selected: false,
            name: d,
            categories: [d],
            color: variable.colorScale(d)
        }));
        return currentData;
    }

    move(event, index, moveUp) {
        event.stopPropagation();
        let currentData = this.state.currentData.slice();
        let currentEntry = currentData[index];
        if (moveUp && index > 0) {
            currentData[index] = currentData[index - 1];
            currentData[index - 1] = currentEntry;
        }
        else if (!moveUp && index < currentData.length - 1) {
            currentData[index] = currentData[index + 1];
            currentData[index + 1] = currentEntry;
        }
        this.setState({currentData: currentData});
    }

    merge() {
        let currentData = this.state.currentData.slice();
        let mergedEntry = {selected: false, name: '', categories: [], color: ''};
        let indicesToDelete = [];
        currentData.forEach(function (d, i) {
            if (d.selected) {
                indicesToDelete.push(i);
                if (mergedEntry.name !== '') {
                    mergedEntry.color = d.color;
                    mergedEntry.name += (',' + d.name)
                }
                else mergedEntry.name = d.name;
                mergedEntry.categories = mergedEntry.categories.concat(d.categories)
            }
        });
        for (let i = indicesToDelete.length - 1; i >= 0; i--) {
            if (i === 0) {
                currentData[indicesToDelete[i]] = mergedEntry;
            }
            else {
                currentData.splice(indicesToDelete[i], 1);
            }
        }
        this.setState({currentData: currentData});
    }

    toggleSelect(e, index) {
        let currentData = this.state.currentData.slice();
        currentData[index].selected = !currentData[index].selected;
        this.setState({currentData: currentData});
    }

    displayCategories() {
        const _self = this;
        const occuranceMapper = this.getPercentOccurences(this.props.store.referencedVariables[this.props.variable].mapper);
        return this.state.currentData.map(function (d, i) {
            let bgColor = "white";
            if (d.selected) {
                bgColor = "lightgrey";
            }
            return (<tr bgcolor={bgColor} onClick={(e) => _self.toggleSelect(e, i)}>
                <td>{i}
                    <Button bsSize="xsmall" onClick={(e) => _self.move(e, i, true)}><Glyphicon
                        glyph="chevron-up"/></Button>
                    <Button bsSize="xsmall" onClick={(e) => _self.move(e, i, false)}><Glyphicon
                        glyph="chevron-down"/></Button>
                </td>
                <td>
                    <form>
                        <FormControl bsSize="small"
                                     type="text"
                                     value={d.name}
                                     onChange={(e) => _self.handleRenameCategory(i, e)}
                        />
                    </form>
                </td>
                <td>{Math.round(occuranceMapper[d.categories.toString()] * 100) / 100}</td>
                <td>
                    <svg width="10" height="10">
                        <rect width="10" height="10"
                              fill={_self.props.store.referencedVariables[_self.props.variable].colorScale(d.categories[0])}/>
                    </svg>
                </td>
            </tr>)
        })
    }


    render() {
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.closeModal}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Modify Categorical Variable</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{minHeight: "400px"}}>

                    <form>
                        <ControlLabel>Variable name</ControlLabel>
                        <FormControl
                            type="text"
                            value={this.state.name}
                            onChange={this.handleNameChange}
                        />
                    </form>
                    <Table bordered condensed responsive>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Category</th>
                            <th>% Occurence</th>
                            <th>Color</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.displayCategories()}
                        </tbody>
                    </Table>
                    <form>
                        <Button onClick={this.merge}>Merge Selected</Button>
                        <Checkbox onClick={this.handleConvertToOrdinal}>Convert to ordinal</Checkbox>
                    </form>


                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.closeModal}
                    >
                        Cancel
                    </Button>

                    <Button onClick={this.handleApply}>
                        Apply

                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default ModifyCategorical;
