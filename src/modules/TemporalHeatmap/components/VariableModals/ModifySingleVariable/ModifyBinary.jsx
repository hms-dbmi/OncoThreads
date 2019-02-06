import React from 'react';
import {observer} from 'mobx-react';
import {Button, Checkbox, ControlLabel, FormControl, Modal, OverlayTrigger, Popover, Table} from 'react-bootstrap';
import uuidv4 from "uuid/v4"
import {SketchPicker} from 'react-color';
import DerivedVariable from "../../../DerivedVariable";
import MapperCombine from "../../../MapperCombineFunctions";
import ColorScales from "../../../ColorScales";


const ModifyBinary = observer(class ModifyBinary extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {
                name: props.derivedVariable !== null ? props.derivedVariable.name : props.variable.name,
                binaryColors: props.derivedVariable !== null ? props.derivedVariable.range : ColorScales.defaultBinaryRange,
                invert: props.derivedVariable !== null
            };
        this.toggleInvert = this.toggleInvert.bind(this);
        this.handleNameChange=this.handleNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);

    }

    getPercentOccurence(categories) {
        let allOccurences = Object.values(this.props.variable.mapper);
        let numOccurences = 0;
        categories.forEach(d => {
            numOccurences += allOccurences.filter(f => d.toString() === f.toString()).length;
        });
        return numOccurences / allOccurences.length * 100
    }


    /**
     * handles the name change
     * @param event
     */
    handleNameChange(event) {
        this.setState({name: event.target.value});
    }


    /**
     * handles pressing apply
     */
    handleApply() {
        let returnVariable;
        if (this.state.invert && this.props.derivedVariable===null) {
            let newId = uuidv4();
            let modification = {true: false, false: true};
            returnVariable = new DerivedVariable(newId, this.state.name, "BINARY", this.props.variable.description, [this.props.variable.id], "invertBinary", modification, this.state.binaryColors, [], MapperCombine.getModificationMapper("modifyCategorical", modification, [this.props.variable.mapper]), this.props.variable.profile);
            if (this.state.name === this.props.variable.name && this.props.derivedVariable === null) {
                returnVariable.name = this.state.name + "_INVERTED";
            }
        }
        else {
            returnVariable = this.props.derivedVariable!==null?this.props.derivedVariable:this.props.variable;
            returnVariable.range = this.state.binaryColors;

        }
        console.log(returnVariable);
        this.props.callback(returnVariable);
        this.props.closeModal();
    }


    static handleOverlayClick(event) {
        document.body.click();
    }


    /**
     * shows the current categories in a table
     * @returns {any[]}
     */
    displayTable() {
        return <div>
            <Table bordered condensed responsive>
                <thead>
                <tr>
                    <th>Category</th>
                    <th>% Occurence</th>
                    <th>Color</th>
                </tr>
                </thead>
                {this.getBinaryContent()}
            </Table>
            <Checkbox onChange={this.toggleInvert} checked={this.state.invert}>Invert</Checkbox>
        </div>
    }


    toggleInvert() {
        this.setState({invert: !this.state.invert});
    }


    getBinaryContent() {
        let colorRects = this.state.binaryColors.map((d, i) => {
            const popover = (
                <Popover id="popover-positioned-right" title="Choose color">
                    <SketchPicker
                        color={d}
                        onChangeComplete={(color) => {
                            let binaryColors = this.state.binaryColors.slice();
                            binaryColors[i] = color.hex;
                            this.setState({binaryColors: binaryColors});
                        }}/>
                </Popover>);
            return <OverlayTrigger rootClose={true} onClick={(e) => ModifyBinary.handleOverlayClick(e)}
                                   trigger="click"
                                   placement="right" overlay={popover}>
                <svg width="10" height="10">
                    <rect stroke="black" width="10" height="10"
                          fill={d}/>
                </svg>
            </OverlayTrigger>;
        });
        let trueOccurence,falseOccurence;
        if(this.state.invert){
                        trueOccurence=Math.round(this.getPercentOccurence([false]) * 100) / 100;
            falseOccurence=Math.round(this.getPercentOccurence([true]) * 100) / 100
        }
        else{
            trueOccurence=Math.round(this.getPercentOccurence([true]) * 100) / 100;
            falseOccurence=Math.round(this.getPercentOccurence([false]) * 100) / 100
        }

        return (<tbody>
        <tr>
            <td>
                true
            </td>
            <td>{trueOccurence}</td>
            <td>
                {colorRects[0]}
            </td>
        </tr>
        <tr>
            <td>
                false
            </td>
            <td>{falseOccurence}</td>
            <td>
                {colorRects[1]}
            </td>
        </tr>
        </tbody>)
    }


    render() {
        return (
            <Modal show={this.props.modalIsOpen}
                   onHide={this.props.closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Modify Categorical Variable</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{minHeight: "400px"}}>
                    <form>
                        <ControlLabel>Variable name</ControlLabel>
                        <FormControl
                            type="text"
                            value={this.state.name}
                            onChange={this.handleNameChange}/>
                    </form>
                    <h5>Description</h5>
                    <p>{this.props.variable.description}</p>
                    {this.displayTable()}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.closeModal}>
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
export default ModifyBinary;
