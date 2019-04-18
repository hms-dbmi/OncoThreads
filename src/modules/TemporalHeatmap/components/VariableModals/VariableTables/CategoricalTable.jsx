import React from 'react';
import {inject, observer} from 'mobx-react';
import {
    Alert,
    Button,
    Checkbox,
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
const CategoricalTable = inject("categoryStore")(observer(class CategoricalTable extends React.Component {

    constructor(props) {
        super(props);
        this.merge = this.merge.bind(this);
        this.unMerge = this.unMerge.bind(this);
    }


    /**
     * merges the selected categories
     */
    merge() {
        this.props.categoryStore.merge();
    }

    /**
     * unmerges all the currently selected merged categories
     */
    unMerge() {
        this.props.categoryStore.unMerge();
    }

    /**
     * toggles selecting categories
     * @param {Object} e
     * @param {number} index
     */
    toggleSelect(e, index) {
        if (e.target.nodeName === "TD") {
            this.props.categoryStore.toggleSelect(index);
        }
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
                <Button disabled={!(this.props.categoryStore.currentCategories.filter(d => d.selected).length > 1)}
                        onClick={this.merge}>Merge
                    selected</Button>
                <Button
                    disabled={!(this.props.categoryStore.currentCategories.filter(d => d.selected && d.categories.length > 1).length > 0)}
                    onClick={this.unMerge}>Unmerge selected</Button>
            </form>
            {this.getRestrictCategories()}
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
        this.props.categoryStore.currentCategories.forEach((d, i) => {
            if (d.name !== undefined) {
                let bgColor = "white";
                if (d.selected) {
                    bgColor = "lightgrey";
                }
                const popover = (
                    <Popover id="popover-positioned-right" title="Choose color">
                        <SketchPicker
                            color={d.color}
                            onChangeComplete={(color) => this.props.categoryStore.changeColor(i, color.hex)}
                        />
                    </Popover>);
                let colorRect = <svg width="10" height="10">
                    <rect stroke="black" width="10" height="10"
                          fill={d.color}/>
                </svg>;
                if (!this.props.categoryStore.isOrdinal) {
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
                        <Button bsSize="xsmall" onClick={() => this.props.categoryStore.move(i, true)}><Glyphicon
                            glyph="chevron-up"/></Button>
                        <Button bsSize="xsmall" onClick={() => this.props.categoryStore.move(i, false)}><Glyphicon
                            glyph="chevron-down"/></Button>
                    </td>
                    <td>
                        <form>
                            <FormControl bsSize="small"
                                         type="text"
                                         value={d.name}
                                         onChange={(e) => this.props.categoryStore.renameCategory(i, e.target.value)}
                            />
                        </form>
                    </td>
                    <td>{Math.round(d.percentOccurence * 100) / 100}</td>
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
        this.props.categoryStore.setIsOrdinal(isOrdinal);
        this.props.categoryStore.changeColorScale(scale);
    }

    /**
     * gets the rects representing an isOrdinal scale
     * @param {function} scale
     * @param {number} rectDim
     * @param {number} numRect
     * @returns {rect[]}
     */
    static getOrdinalRects(colors, rectDim, numRect) {
        let rects = [];
        for (let i = 0; i < numRect ; i++) {
            rects.push(<rect key={i} fill={d3.interpolateRgb(...colors)(i/(numRect-1))} width={rectDim}
                             height={rectDim}
                             x={i* rectDim}/>)
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
    static getCategoricalRects(colors, rectDim, numRect) {
        let rects = [];
        for (let i = 0; i < numRect; i++) {
            rects.push(<rect key={i} fill={colors[i]} width={rectDim}
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
        return <form>
            <FormGroup>
                <ControlLabel>Categorical Scales</ControlLabel>
                {ColorScales.categoricalColors.map((d, i) => <Radio key={i} onChange={() => this.handleColorScaleChange(d, false)}
                                                        name="ColorScaleGroup">
                    <svg width={rectDim * numRect}
                         height={rectDim}>{CategoricalTable.getCategoricalRects(d, rectDim, numRect)}</svg>
                    {"  Colors: " + d.length}
                </Radio>)}
                <ControlLabel>Ordinal Scales</ControlLabel>
                {ColorScales.continuousTwoColorRanges.map((d, i) => <Radio key={i} onChange={() => this.handleColorScaleChange(d, true)}
                                                    name="ColorScaleGroup">
                    <svg width={rectDim * numRect}
                         height={rectDim}>{CategoricalTable.getOrdinalRects(d, rectDim, numRect)}</svg>
                </Radio>)}
            </FormGroup>
        </form>

    }

    /**
     * gets restrict categories inputs
     * @return {*}
     */
    getRestrictCategories() {
        return <div>
            <Checkbox checked={this.props.categoryStore.restrictCategories}
                      value={this.props.categoryStore.restrictCategories}
                      onChange={() => this.props.categoryStore.toggleRestrictCategories()}>Restrict number of
                categories</Checkbox>
            <input style={{visibility: this.props.categoryStore.restrictCategories ? "visible" : "hidden"}}
                   onChange={(e) => this.props.categoryStore.setNumberOfCategories(e.target.value)}
                   type="number"
                   name="points"
                   value={this.props.categoryStore.numberOfCategories}
                   step="1" min="2" max={this.props.categoryStore.domain.length}/>
        </div>
    }

    /**
     * creates a warning if category names are not unique
     * @return {*}
     */
    getUniqueCategoryWarning() {
        let alert = null;
        if (!this.props.categoryStore.uniqueCategories) {
            alert = <Alert>Please choose unique category names</Alert>
        }
        return alert;
    }

    render() {
        return (
            this.displayTable()
        )
    }
}));
export default CategoricalTable;
