import React from 'react';
import {observer} from 'mobx-react';
import {
    Alert,
    Button,
    ControlLabel,
    FormControl,
    FormGroup,
    Glyphicon,
    OverlayTrigger,
    Popover,
    Radio,
    Table
} from 'react-bootstrap';
import {SketchPicker} from 'react-color';
import FontAwesome from 'react-fontawesome';
import * as d3 from "d3";
import ColorScales from "../../../UtilityClasses/ColorScales";

/**
 * Component for displaying and editing categories of a categorical or ordinal variable
 */
const CategoricalTable = observer(class CategoricalTable extends React.Component {

    constructor(props) {
        super(props);
        this.merge = this.merge.bind(this);
        this.unMerge = this.unMerge.bind(this);
    }

    /**
     * gets percent occurences for each category
     * @param {String[]} categories
     * @returns {number}
     */
    getPercentOccurence(categories) {
        let allOccurences = Object.values(this.props.mapper);
        let numOccurences = 0;
        categories.forEach(d => {
            numOccurences += allOccurences.filter(f => d === f).length;
        });
        return numOccurences / allOccurences.length * 100
    }

    /**
     * handles renaming a category
     * @param {number} index
     * @param {Object} e
     */
    handleRenameCategory(index, e) {
        let currentData = this.props.currentCategories.slice();
        currentData[index].name = e.target.value;
        this.props.setCurrentCategories(currentData);
    }


    /**
     * moves a category up or down
     * @param {Object} event
     * @param {number} index
     * @param {boolean} moveUp
     */
    move(event, index, moveUp) {
        let currentData = this.props.currentCategories.slice();
        let currentEntry = currentData[index];
        if (moveUp && index > 0) {
            currentData[index] = currentData[index - 1];
            currentData[index - 1] = currentEntry;
        }
        else if (!moveUp && index < currentData.length - 1) {
            currentData[index] = currentData[index + 1];
            currentData[index + 1] = currentEntry;
        }
        if (this.props.isOrdinal) {
            currentData.forEach((d, i) => {
                d.color = this.props.colorScale((i * 2 + 1) / (currentData.length * 2 + 1));
            });
        }
        this.props.setCurrentCategories(currentData);
    }

    /**
     * merges the selected categories
     */
    merge() {
        let currentData = this.props.currentCategories.slice();
        let mergedEntry = {selected: false, name: '', categories: [], color: ''};
        let indicesToDelete = [];
        currentData.forEach((d, i) => {
            if (d.selected) {
                indicesToDelete.push(i);
                if (mergedEntry.name !== '') {
                    mergedEntry.name += (',' + d.name)
                }
                else {
                    mergedEntry.color = d.color;
                    mergedEntry.name = d.name;
                }
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
        this.props.setCurrentCategories(currentData);
    }

    /**
     * unmerges all the currently selected merged categories
     */
    unMerge() {
        let currentData = this.props.currentCategories.slice();
        let unmergedEntries = [];
        let mergedIndeces = [];
        currentData.forEach((d, i) => {
            if (d.selected && d.categories.length > 1) {
                let currentEntries = d.categories.map((d) => {
                    return ({
                        selected: false,
                        name: d,
                        categories: [d],
                        color: this.props.colorScale(d)
                    })
                });
                mergedIndeces.push(i);
                unmergedEntries.push(currentEntries);
            }
        });
        for (let i = mergedIndeces.length - 1; i >= 0; i--) {
            currentData.splice(mergedIndeces[i], 1);
            unmergedEntries[i].forEach((d, j) => currentData.splice(mergedIndeces[i] + j, 0, d));
        }
        currentData.forEach((d, i) => {
            let value = d.name;
            if (this.props.isOrdinal) {
                value = (i * 2 + 1) / (currentData.length * 2 + 1);
            }
            d.color = this.props.colorScale(value);
        });
        this.setState({currentCategories: currentData});
    }

    /**
     * toggles selecting categories
     * @param {Object} e
     * @param {number} index
     */
    toggleSelect(e, index) {
        if (e.target.nodeName === "TD") {
            let currentData = this.props.currentCategories.slice();
            currentData[index].selected = !currentData[index].selected;
            this.props.setCurrentCategories(currentData);
        }
    }


    /**
     * handles the change of a single color
     * @param {String} color
     * @param {number} index
     */
    handleColorChange(color, index) {
        let currentData = this.props.currentCategories.slice();
        currentData[index].color = color.hex;
        this.props.setCurrentCategories(currentData);

    }

    static handleOverlayClick() {
        document.body.click();
    }


    /**
     * shows the current categories in a table
     * @returns {*}
     */
    displayTable() {
        return <div>
            <Table bordered condensed responsive>
                <thead>
                {this.getTableHead()}
                </thead>
                <tbody>
                {this.getTableContent()}
                </tbody>
            </Table>
            <form>
                <Button disabled={!(this.props.currentCategories.filter(d => d.selected).length > 1)}
                        onClick={this.merge}>Merge
                    selected</Button>
                <Button
                    disabled={!(this.props.currentCategories.filter(d => d.selected && d.categories.length > 1).length > 0)}
                    onClick={this.unMerge}>Unmerge selected</Button>
            </form>
            {this.getUniqueCategoryWarning()}
        </div>
    }

    /**
     * gets head of table
     * @return {*}
     */
    getTableHead() {
        const colorScalePopOver = <Popover id="popover-positioned-right" title="Choose color scale">
            {this.getColorScalePopover()}
        </Popover>;
        return <tr>
            <th>#</th>
            <th>Category</th>
            <th>% Occurence</th>
            <th>Color
                <OverlayTrigger rootClose={true}
                                onClick={(e) => CategoricalTable.handleOverlayClick(e)}
                                trigger="click"
                                placement="right" overlay={colorScalePopOver}><FontAwesome
                    name="paint-brush"/></OverlayTrigger></th>
        </tr>

    }

    /**
     * gets table content
     * @return {[]}
     */
    getTableContent() {
        let tableContent = [];
        this.props.currentCategories.forEach((d, i) => {
            if (d.name !== undefined) {
                let bgColor = "white";
                if (d.selected) {
                    bgColor = "lightgrey";
                }
                const popover = (
                    <Popover id="popover-positioned-right" title="Choose color">
                        <SketchPicker
                            color={d.color}
                            onChangeComplete={(color) => this.handleColorChange(color, i)}
                        />
                    </Popover>);
                let colorRect = <svg width="10" height="10">
                    <rect stroke="black" width="10" height="10"
                          fill={d.color}/>
                </svg>;
                if (!this.props.isOrdinal) {
                    colorRect =
                        <OverlayTrigger rootClose={true} onClick={(e) => CategoricalTable.handleOverlayClick(e)}
                                        trigger="click"
                                        placement="right" overlay={popover}>
                            <svg width="10" height="10">
                                <rect stroke="black" width="10" height="10"
                                      fill={d.color}/>
                            </svg>
                        </OverlayTrigger>
                }
                tableContent.push(<tr key={d.categories} bgcolor={bgColor} onClick={(e) => this.toggleSelect(e, i)}>
                    <td>{i}
                        <Button bsSize="xsmall" onClick={(e) => this.move(e, i, true)}><Glyphicon
                            glyph="chevron-up"/></Button>
                        <Button bsSize="xsmall" onClick={(e) => this.move(e, i, false)}><Glyphicon
                            glyph="chevron-down"/></Button>
                    </td>
                    <td>
                        <form>
                            <FormControl bsSize="small"
                                         type="text"
                                         value={d.name}
                                         onChange={(e) => this.handleRenameCategory(i, e)}
                            />
                        </form>
                    </td>
                    <td>{Math.round(this.getPercentOccurence(d.categories) * 100) / 100}</td>
                    <td>
                        {colorRect}
                    </td>
                </tr>)
            }
        });
        return tableContent;
    }


    /**
     * handle the change of color scale. Changes isOrdinal state depending on the chosen scale
     * @param {function} scale
     * @param {boolean} isOrdinal
     */
    handleColorScaleChange(scale, isOrdinal) {
        let currentData = this.props.currentCategories.slice();
        currentData.forEach((d, i) => {
            d.color = scale((i * 2 + 1) / (currentData.length * 2 + 1));
        });
        this.props.setColorScale(scale);
        this.props.setCurrentCategories(currentData);
        this.props.setOrdinal(isOrdinal);
    }

    /**
     * gets the rects representing an isOrdinal scale
     * @param {function} scale
     * @param {number} rectDim
     * @param {number} numRect
     * @returns {rect[]}
     */
    static getOrdinalRects(scale, rectDim, numRect) {
        let rects = [];
        for (let i = 1; i < numRect + 1; i++) {
            rects.push(<rect key={i} fill={scale((1 / (numRect + 1)) * i)} width={rectDim}
                             height={rectDim}
                             x={(i - 1) * rectDim}/>)
        }
        return rects;
    }

    /**
     * gets the rects representing a categorical scale
     * @param {function} scale
     * @param {number} rectDim
     * @param {number} numRect
     * @returns {rect[]}
     */
    static getCategoricalRects(scale, rectDim, numRect) {
        let rects = [];
        for (let i = 0; i < numRect; i++) {
            rects.push(<rect key={i} fill={scale.range()[i]} width={rectDim}
                             height={rectDim}
                             x={i * rectDim}/>)
        }
        return rects;
    }

    /**
     * gets the popover for the color scale selection
     * @returns {*}
     */
    getColorScalePopover() {
        let rectDim = 20;
        let numRect = 5;
        let ordinalScales =ColorScales.ordinalScales;
        let categoricalScales = ColorScales.categoricalColors.map(d=>d3.scaleOrdinal().range(d));
        return <form>
            <FormGroup>
                <ControlLabel>Categorical Scales</ControlLabel>
                {categoricalScales.map((d, i) => <Radio key={i} onChange={() => this.handleColorScaleChange(d, false)}
                                                        name="ColorScaleGroup">
                    <svg width={rectDim * numRect}
                         height={rectDim}>{CategoricalTable.getCategoricalRects(d, rectDim, numRect)}</svg>
                    {"  Colors: " + d.range().length}
                </Radio>)}
                <ControlLabel>Ordinal Scales</ControlLabel>
                {ordinalScales.map((d, i) => <Radio key={i} onChange={() => this.handleColorScaleChange(d, true)}
                                                    name="ColorScaleGroup">
                    <svg width={rectDim * numRect}
                         height={rectDim}>{CategoricalTable.getOrdinalRects(d, rectDim, numRect)}</svg>
                </Radio>)}
            </FormGroup>
        </form>

    }

    /**
     * creates a warning if category names are not unique
     * @return {*}
     */
    getUniqueCategoryWarning() {
        let alert = null;
        if (new Set(this.props.currentCategories.map(d => d.name)).size !== this.props.currentCategories.length) {
            alert = <Alert>Please choose unique category names</Alert>
        }
        return alert;
    }

    render() {
        return (
            this.displayTable()
        )
    }
});
export default CategoricalTable;
