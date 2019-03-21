import React from 'react';
import {observer} from 'mobx-react';
import {ControlLabel, FormGroup, Radio} from 'react-bootstrap';
import BinaryTable from "../VariableTables/BinaryTable";
import CategoricalTable from "../VariableTables/CategoricalTable";
import * as d3 from "d3";

/**
 * Component for the combinarion of two or more binary variables
 */
const BinaryCombine = observer(class BinaryCombine extends React.Component {
    constructor(props) {
        super(props);
        this.setColorScale = this.setColorScale.bind(this);
    }

    /**
     * sets the color scale of the combined variable
     * @param {d3.scaleOrdinal} colorScale
     */
    setColorScale(colorScale) {
        this.props.setColors(colorScale.range);
    }


    render() {
        let result = null;
        if (Object.keys(this.props.mapper).length > 0) {
            // depending on the datatype of the combined variable display either the table for binary categories or the table showing categorical categories
            if (this.props.modification.datatype === "BINARY") {
                result = [<ControlLabel key={"label"}>Result</ControlLabel>
                    , <BinaryTable key={"table"}
                                   mapper={this.props.mapper}
                                   binaryColors={this.props.variableRange}
                                   invert={false}
                                   setColors={this.props.setColors}/>]
            }
            else {
                result = [<ControlLabel key={"label"}>Result</ControlLabel>
                    , <CategoricalTable key={"table"}
                                        currentCategories={this.props.currentVarCategories}
                                        mapper={this.props.mapper}
                                        ordinal={this.props.isOrdinal}
                                        colorScale={d3.scaleOrdinal().range(this.props.variableRange).domain(this.props.variableDomain)}
                                        setColorScale={this.setColorScale}
                                        setCurrentCategories={this.props.setCurrentVarCategories}
                                        setOrdinal={this.props.setOrdinal}
                    />]
            }
        }
        return (
            <FormGroup>
                Select binary operator
                <Radio onChange={() => this.props.setModification({operator: "or", datatype: "BINARY"})}
                       checked={this.props.modification.operator === "or" && this.props.modification.datatype === "BINARY"}
                       name="binaryCombine">
                    OR (binary)
                </Radio>
                <Radio onChange={() => this.props.setModification({operator: "and", datatype: "BINARY"})}
                       checked={this.props.modification.operator === "and" && this.props.modification.datatype === "BINARY"}
                       name="binaryCombine">
                    AND (binary)
                </Radio>
                <Radio onChange={() => this.props.setModification({
                    operator: "or",
                    datatype: "STRING",
                    mapping: null
                })}
                       checked={this.props.modification.operator === "or" && this.props.modification.datatype === "STRING"}
                       name="binaryCombine">
                    Create combined categories
                </Radio>
                {result}
            </FormGroup>
        )
    }
});
export default BinaryCombine;
