import React from 'react';
import {observer} from 'mobx-react';
import {OverlayTrigger, Popover, Table} from 'react-bootstrap';
import {SketchPicker} from 'react-color';

/**
 * table for displaying a binary variable
 */
const BinaryTable = observer(class BinaryTable extends React.Component {
    getPercentOccurence(categories) {
        let allOccurences = Object.values(this.props.mapper);
        let numOccurences = 0;
        categories.forEach(d => {
            numOccurences += allOccurences.filter(f => d.toString() === f.toString()).length;
        });
        return numOccurences / allOccurences.length * 100
    }

    static handleOverlayClick(event) {
        document.body.click();
    }

    getBinaryContent() {
        let colorRects = this.props.binaryColors.map((d, i) => {
            const popover = (
                <Popover id="popover-positioned-right" title="Choose color">
                    <SketchPicker
                        color={d}
                        onChangeComplete={(color) => {
                            let binaryColors = this.props.binaryColors.slice();
                            binaryColors[i] = color.hex;
                            this.props.setColors(binaryColors);
                        }}/>
                </Popover>);
            return <OverlayTrigger rootClose={true} onClick={(e) => BinaryTable.handleOverlayClick(e)}
                                   trigger="click"
                                   placement="right" overlay={popover}>
                <svg width="10" height="10">
                    <rect stroke="black" width="10" height="10"
                          fill={d}/>
                </svg>
            </OverlayTrigger>;
        });
               let trueOccurence, falseOccurence;
        if (this.props.invert) {
            trueOccurence = Math.round(this.getPercentOccurence([false]) * 100) / 100;
            falseOccurence = Math.round(this.getPercentOccurence([true]) * 100) / 100
        }
        else {
            trueOccurence = Math.round(this.getPercentOccurence([true]) * 100) / 100;
            falseOccurence = Math.round(this.getPercentOccurence([false]) * 100) / 100
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
        return (<Table bordered condensed responsive>
                <thead>
                <tr>
                    <th>Category</th>
                    <th>% Occurence</th>
                    <th>Color</th>
                </tr>
                </thead>
                {this.getBinaryContent()}
            </Table>)
    }
});
export default BinaryTable;
