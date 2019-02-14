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
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import * as d3 from "d3";

/**
 * table for displaying and editing categories of a categorical or ordinal variable
 */
const CategoricalTable = observer(class CategoricalTable extends React.Component {

    constructor(props) {
        super(props);
        this.merge = this.merge.bind(this);
        this.unMerge = this.unMerge.bind(this);
    }

    /**
     * gets percent occurences for each category
     * @param categories
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
     * handles renaming a profile
     * @param index
     * @param e
     */
    handleRenameCategory(index, e) {
        let currentData = this.props.currentData.slice();
        currentData[index].name = e.target.value;
        this.props.setCurrentData(currentData);
    }


    /**
     * moves a profile up or down
     * @param event
     * @param index
     * @param moveUp
     */
    move(event, index, moveUp) {
        let currentData = this.props.currentData.slice();
        let currentEntry = currentData[index];
        if (moveUp && index > 0) {
            currentData[index] = currentData[index - 1];
            currentData[index - 1] = currentEntry;
        }
        else if (!moveUp && index < currentData.length - 1) {
            currentData[index] = currentData[index + 1];
            currentData[index + 1] = currentEntry;
        }
        if (this.props.ordinal) {
            currentData.forEach((d, i) => {
                d.color = this.props.colorScale((i * 2 + 1) / (currentData.length * 2 + 1));
            });
        }
        this.props.setCurrentData(currentData);
    }

    /**
     * merges the selected categories
     */
    merge() {
        let currentData = this.props.currentData.slice();
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
        this.props.setCurrentData(currentData);
    }

    /**
     * unmerges all the currently selected merged categories
     */
    unMerge() {
        let currentData = this.props.currentData.slice();
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
            if (this.props.ordinal) {
                value = (i * 2 + 1) / (currentData.length * 2 + 1);
            }
            d.color = this.props.colorScale(value);
        });
        this.setState({currentData: currentData});
    }

    /**
     * toggles selecting categories
     * @param e
     * @param index
     */
    toggleSelect(e, index) {
        if (e.target.nodeName === "TD") {
            let currentData = this.props.currentData.slice();
            currentData[index].selected = !currentData[index].selected;
            this.props.setCurrentData(currentData);
        }
    }


    /**
     * handles the change of a single color
     * @param color
     * @param index
     */
    handleColorChange(color, index) {
        let currentData = this.props.currentData.slice();
        currentData[index].color = color.hex;
        this.props.setCurrentData(currentData);

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
                {this.getTableHead()}
                </thead>
                <tbody>
                {this.getTableContent()}
                </tbody>
            </Table>
            <form>
                <Button disabled={!(this.props.currentData.filter(d => d.selected).length > 1)} onClick={this.merge}>Merge
                    selected</Button>
                <Button
                    disabled={!(this.props.currentData.filter(d => d.selected && d.categories.length > 1).length > 0)}
                    onClick={this.unMerge}>Unmerge selected</Button>
            </form>
            {this.getUniqueCategoryWarning()}
        </div>
    }

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

    getTableContent() {
        let tableContent=[];
        this.props.currentData.forEach((d, i) => {
            if(d.name!==undefined) {
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
                if (!this.props.ordinal) {
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
     * handle the change of color scale. Changes ordinal state depending on the chosen scale
     * @param scale
     * @param ordinal
     */
    handleColorScaleChange(scale, ordinal) {
        let currentData = this.props.currentData.slice();
        currentData.forEach((d, i) => {
            d.color = scale((i * 2 + 1) / (currentData.length * 2 + 1));
        });
        this.props.setColorScale(scale);
        this.props.setCurrentData(currentData);
        this.props.setOrdinal(ordinal);
    }

    /**
     * gets the rects representing an ordinal scale
     * @param scale
     * @param rectDim
     * @param numRect
     * @returns {Array}
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
     * @param scale
     * @param rectDim
     * @param numRect
     * @returns {Array}
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
        let ordinalScales = [d3ScaleChromatic.interpolateBlues, d3ScaleChromatic.interpolateGreens, d3ScaleChromatic.interpolateGreys, d3ScaleChromatic.interpolateOranges, d3ScaleChromatic.interpolatePurples, d3ScaleChromatic.interpolateReds];
        let categoricalScales = [d3.scaleOrdinal().range(['#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a']),
            d3.scaleOrdinal().range(['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f']),
            d3.scaleOrdinal().range(['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec']),
            d3.scaleOrdinal().range(['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'])];
        return <form>
            <FormGroup>
                <ControlLabel>Ordinal Scales</ControlLabel>
                {ordinalScales.map((d, i) => <Radio key={i} onChange={() => this.handleColorScaleChange(d, true)}
                                                    name="ColorScaleGroup">
                    <svg width={rectDim * numRect}
                         height={rectDim}>{CategoricalTable.getOrdinalRects(d, rectDim, numRect)}</svg>
                </Radio>)}
                <ControlLabel>Categorical Scales</ControlLabel>
                {categoricalScales.map((d, i) => <Radio key={i} onChange={() => this.handleColorScaleChange(d, false)}
                                                        name="ColorScaleGroup">
                    <svg width={rectDim * numRect}
                         height={rectDim}>{CategoricalTable.getCategoricalRects(d, rectDim, numRect)}</svg>
                    {"  Colors: " + d.range().length}
                </Radio>)}
            </FormGroup>
        </form>

    }


    getUniqueCategoryWarning() {
        let alert = null;
        if (new Set(this.props.currentData.map(d => d.name)).size !== this.props.currentData.length) {
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
