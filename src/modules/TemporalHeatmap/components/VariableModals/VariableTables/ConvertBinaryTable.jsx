import React from 'react';
import {observer} from 'mobx-react';
import {Button, ButtonGroup, OverlayTrigger, Popover, Table} from 'react-bootstrap';
import {SketchPicker} from 'react-color';

/**
 * table for the conversion of a categorical variable to a binary variable
 */
const ConvertBinaryTable = observer(class ConvertBinaryTable extends React.Component {
    /**
     * gets percent occurrences for each category
     * @param categories
     * @returns {number}
     */
    getPercentOccurence(categories) {
        let allOccurences = Object.values(this.props.mapper).filter(d => d !== undefined);
        let numOccurences = 0;
        categories.forEach(d => {
            numOccurences += allOccurences.filter(f => d.toString() === f.toString()).length;
        });
        return numOccurences / allOccurences.length * 100
    }

    /**
     * handles change in binary Mapping
     * @param name
     * @param value
     */
    handleBinaryChange(name, value) {
        let binaryMapping = Object.assign({}, this.props.binaryMapping);
        binaryMapping[name] = value;
        this.props.setBinaryMapping(binaryMapping);
    }


    static handleOverlayClick(event) {
        document.body.click();
    }


    /**
     * shows the current categories in a table
     * @returns {any[]}
     */
    displayTable() {
        let colorRects = this.props.binaryColors.map((d, i) => {
            const popover = (
                <Popover id="popover-positioned-right" title="Choose color">
                    <SketchPicker
                        color={d}
                        onChangeComplete={(color) => {
                            let binaryColors = this.props.binaryColors.slice();
                            binaryColors[i] = color.hex;
                            this.props.setBinaryColors(binaryColors);
                        }}
                    />
                </Popover>);
            return <OverlayTrigger rootClose={true} onClick={(e) => ConvertBinaryTable.handleOverlayClick(e)}
                                   trigger="click"
                                   placement="right" overlay={popover}>
                <svg width="10" height="10">
                    <rect stroke="black" width="10" height="10"
                          fill={d}/>
                </svg>
            </OverlayTrigger>
        });

        return <div>
            <Table bordered condensed responsive>
                <thead>
                <tr>
                    <th>Category</th>
                    <th>% Occurence</th>
                    <th>Binary value</th>
                </tr>
                </thead>
                <tbody>
                {this.getTableContent()}
                </tbody>
            </Table>
            <div>
                <p>Click to change color:</p>
                true: {colorRects[0]}
                <br/>
                false: {colorRects[1]}
            </div>
        </div>
    }


    getTableContent() {
        return this.props.variableDomain.map(d => {
            return (<tr key={d}>
                <td>
                    {d.toString()}
                </td>
                <td>{Math.round(this.getPercentOccurence([d]) * 100) / 100}</td>
                <td>
                    <ButtonGroup>
                        <Button onClick={() => this.handleBinaryChange(d, true)}
                                active={this.props.binaryMapping[d] === true}
                                value={true} bsSize="xsmall">true</Button>
                        <Button onClick={() => this.handleBinaryChange(d, false)}
                                active={this.props.binaryMapping[d] === false}
                                value={false} bsSize="xsmall">false</Button>
                        <Button onClick={() => this.handleBinaryChange(d, undefined)}
                                active={this.props.binaryMapping[d] === undefined} value={undefined}
                                bsSize="xsmall">undefined</Button>
                    </ButtonGroup>
                </td>
            </tr>)
        });
    }


    render() {
        return (this.displayTable())
    }
});
export default ConvertBinaryTable;
