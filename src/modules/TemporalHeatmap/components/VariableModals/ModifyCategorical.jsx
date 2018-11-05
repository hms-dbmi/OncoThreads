import React from 'react';
import {observer} from 'mobx-react';
import {
    Button,
    ControlLabel,
    FormControl,
    FormGroup,
    Glyphicon,
    Modal,
    OverlayTrigger,
    Popover,
    Radio,
    Table
} from 'react-bootstrap';
import uuidv4 from "uuid/v4"
import {SketchPicker} from 'react-color';
import DerivedVariable from "../../DerivedVariable";
import MapperCombine from "../../MapperCombineFunctions";
import FontAwesome from 'react-fontawesome';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import * as d3 from "d3";


const ModifyCategorical = observer(class ModifyCategorical extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {
                colorScale: d3.scaleOrdinal().range(['#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a']),
                currentData: this.createCurrentData(),
                name: props.variable.derived ? props.variable.name : props.variable.name + "_MODIFIED",
                ordinal: false,
            };
        this.merge = this.merge.bind(this);
        this.unMerge = this.unMerge.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
    }

    /**
     * computes the percent occurrence
     */
    getPercentOccurences() {
        let occurences = {};
        this.state.currentData.forEach(d => {
            const mapEntry = d.categories.toString();
            occurences[mapEntry] = 0;
            d.categories.forEach(f => {
                for (let entry in this.props.variable.mapper) {
                    if (this.props.variable.mapper[entry] === f) {
                        occurences[mapEntry] += 1 / Object.keys(this.props.variable.mapper).length * 100;
                    }
                }
            })
        });
        return occurences;
    }

    /**
     * handles renaming a category
     * @param index
     * @param e
     */
    handleRenameCategory(index, e) {
        e.stopPropagation();
        let currentData = this.state.currentData.slice();
        currentData[index].name = e.target.value;
        this.setState({currentData: currentData});
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
        let categoryMapping = {};
        this.props.variable.domain.forEach((d) => {
            this.state.currentData.forEach(f => {
                if (f.categories.includes(d)) {
                    categoryMapping[d] = f.name;
                }
            });
        });
        let newId = uuidv4();
        let variable = new DerivedVariable(newId, this.state.name, "STRING", this.props.variable.description, [this.props.variable.id], "modifyCategorical", categoryMapping, this.state.currentData.map(d => d.color), this.state.currentData.map(d => d.name), MapperCombine.getModificationMapper("modifyCategorical", categoryMapping, [this.props.variable.mapper]));
        this.props.callback(variable);
        this.props.closeModal();
    }

    /**
     * creates the initial list of current categories
     * @returns {Array}
     */
    createCurrentData() {
        let currentData = [];
        if (this.props.derivedVariable !== null) {
            this.props.derivedVariable.domain.forEach(d=> {
                for (let key in this.props.derivedVariable.modification) {
                    if(this.props.derivedVariable.modification[key]===d) {
                        if (!(currentData.map(d => d.name).includes(d))) {
                            currentData.push({
                                selected: false,
                                name: d,
                                categories: [],
                                color: this.props.derivedVariable.colorScale(d)
                            })
                        }
                        currentData[currentData.map(d => d.name).indexOf(d)].categories.push(key);
                    }
                }
            });
        }
        else {
            this.props.variable.domain.forEach(d => {
                currentData.push({
                    selected: false,
                    name: d,
                    categories: [d],
                    color: this.props.variable.colorScale(d)
                })
            });
        }
        return currentData;
    }

    /**
     * moves a category up or down
     * @param event
     * @param index
     * @param moveUp
     */
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
        if (this.state.ordinal) {
            currentData.forEach((d, i) => {
                d.color = this.state.colorScale((i * 2 + 1) / (currentData.length * 2 + 1));
            });
        }
        this.setState({currentData: currentData});
    }

    /**
     * merges the selected categories
     */
    merge() {
        let currentData = this.state.currentData.slice();
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
        this.setState({currentData: currentData});
    }

    /**
     * unmerges all the currently selected merged categories
     */
    unMerge() {
        let currentData = this.state.currentData.slice();
        let unmergedEntries = [];
        let mergedIndeces = [];
        currentData.forEach((d, i) => {
            if (d.selected && d.categories.length > 1) {
                let currentEntries = d.categories.map((d) => {
                    return ({
                        selected: false,
                        name: d,
                        categories: [d],
                        color: this.state.colorScale(d)
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
            if (this.state.ordinal) {
                value = (i * 2 + 1) / (currentData.length * 2 + 1);
            }
            d.color = this.state.colorScale(value);
        });
        this.setState({currentData: currentData});
    }

    /**
     * toggles selecting categories
     * @param e
     * @param index
     */
    toggleSelect(e, index) {
        let currentData = this.state.currentData.slice();
        currentData[index].selected = !currentData[index].selected;
        this.setState({currentData: currentData});
    }

    /**
     * handles the change of a single color
     * @param color
     * @param index
     */
    handleColorChange(color, index) {
        let currentData = this.state.currentData.slice();
        currentData[index].color = color.hex;
        this.setState({currentData: currentData});

    }

    handleOverlayClick(event) {
        event.stopPropagation();
        document.body.click();
    }


    /**
     * shows the current categories in a table
     * @returns {any[]}
     */
    displayCategories() {
        const _self = this;
        const occuranceMapper = this.getPercentOccurences();
        return this.state.currentData.map(function (d, i) {
            let bgColor = "white";
            if (d.selected) {
                bgColor = "lightgrey";
            }
            const popover = (
                <Popover id="popover-positioned-right" title="Choose color">
                    <SketchPicker
                        color={d.color}
                        onChangeComplete={(color) => _self.handleColorChange(color, i)}
                    />
                </Popover>);
            let colorRect = <svg width="10" height="10">
                <rect stroke="black" width="10" height="10"
                      fill={d.color}/>
            </svg>;
            if (!_self.state.ordinal) {
                colorRect =
                    <OverlayTrigger rootClose={true} onClick={(e) => _self.handleOverlayClick(e)} trigger="click"
                                    placement="right" overlay={popover}>
                        <svg width="10" height="10">
                            <rect stroke="black" width="10" height="10"
                                  fill={d.color}/>
                        </svg>
                    </OverlayTrigger>
            }
            return (<tr key={d.name} bgcolor={bgColor} onClick={(e) => _self.toggleSelect(e, i)}>
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
                    {colorRect}
                </td>
            </tr>)
        })
    }

    /**
     * handle the change of color scale. Changes ordinal state depending on the chosen scale
     * @param scale
     * @param ordinal
     */
    handleColorScaleChange(scale, ordinal) {
        let currentData = this.state.currentData.slice();
        currentData.forEach((d, i) => {
            d.color = scale((i * 2 + 1) / (currentData.length * 2 + 1));
        });
        this.setState({colorScale: scale, currentData: currentData, ordinal: ordinal});
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
                         height={rectDim}>{ModifyCategorical.getOrdinalRects(d, rectDim, numRect)}</svg>
                </Radio>)}
                <ControlLabel>Categorical Scales</ControlLabel>
                {categoricalScales.map((d, i) => <Radio key={i} onChange={() => this.handleColorScaleChange(d, false)}
                                                        name="ColorScaleGroup">
                    <svg width={rectDim * numRect}
                         height={rectDim}>{ModifyCategorical.getCategoricalRects(d, rectDim, numRect)}</svg>
                    {"  Colors: " + d.range().length}
                </Radio>)}
            </FormGroup>
        </form>

    }


    render() {
        const colorScalePopOver = <Popover id="popover-positioned-right" title="Choose color scale">
            {this.getColorScalePopover()}
        </Popover>;
        return (
            <Modal backdrop={"static"}
                   show={this.props.modalIsOpen}
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
                    <Table bordered condensed responsive>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Category</th>
                            <th>% Occurence</th>
                            <th>Color
                                <OverlayTrigger rootClose={true} onClick={(e) => this.handleOverlayClick(e)}
                                                trigger="click"
                                                placement="right" overlay={colorScalePopOver}><FontAwesome
                                    name="paint-brush"/></OverlayTrigger></th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.displayCategories()}
                        </tbody>
                    </Table>
                    <form>
                        <Button onClick={this.merge}>Merge selected</Button>
                        <Button onClick={this.unMerge}>Split selected</Button>

                    </form>
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
export default ModifyCategorical;
