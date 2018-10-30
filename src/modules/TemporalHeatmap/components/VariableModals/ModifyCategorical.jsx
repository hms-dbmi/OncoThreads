import React from 'react';
import {observer} from 'mobx-react';
import {
    Button,
    Checkbox,
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


const ModifyCategorical = observer(class ModifyCategorical extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {
                currentData: this.createCurrentData(),
                name: props.variable.name + "_MODIFIED",
                ordinal: false,
                ordinalColorScale: d3ScaleChromatic.interpolateGreys
            };
        this.merge = this.merge.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleConvertToOrdinal = this.handleConvertToOrdinal.bind(this);
        this.handleApply = this.handleApply.bind(this);
    }

    /**
     * computes the percent occurance
     */
    getPercentOccurences() {
        const _self = this;
        let occurences = {};
        this.state.currentData.forEach(d => {
            const mapEntry = d.categories.toString();
            occurences[mapEntry] = 0;
            d.categories.forEach(f => {
                for (let entry in _self.props.variable.mapper) {
                    if (_self.props.variable.mapper[entry] === f) {
                        occurences[mapEntry] += 1 / Object.keys(_self.props.variable.mapper).length * 100;
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
     * handles convert to ordinal event
     * @param event
     */
    handleConvertToOrdinal(event) {
        let currentData = this.state.currentData.slice();
        const _self = this;
        if (event.target.checked) {
            currentData.forEach((d, i) => {
                d.color = this.state.ordinalColorScale((i * 2 + 1) / (currentData.length * 2 + 1));
            });
            this.setState({ordinal: true, currentData: currentData})
        }
        else {
            currentData.forEach(d => {
                d.color = this.props.variable.colorScale(d.name);
            });
            this.setState({ordinal: false, currentData: currentData});
        }
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
        let datatype = this.state.ordinal ? "ORDINAL" : "STRING";
        let variable = new DerivedVariable(newId, this.state.name, datatype, this.props.variable.description, [this.props.variable.id], "modifyCategorical", categoryMapping, this.state.currentData.map(d => d.color), this.state.currentData.map(d => d.name), MapperCombine.getModificationMapper("modifyCategorical", categoryMapping, [this.props.variable.mapper]));
        this.props.callback(variable);
        this.props.closeModal();
    }

    /**
     * creates the initial list of current categories
     * @returns {Array}
     */
    createCurrentData() {
        let currentData = [];
        const _self = this;
        this.props.variable.domain.forEach(d => currentData.push({
            selected: false,
            name: d,
            categories: [d],
            color: _self.props.variable.colorScale(d)
        }));
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
                d.color = this.state.ordinalColorScale((i * 2 + 1) / (currentData.length * 2 + 1));
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
     * toggles selecting categories
     * @param e
     * @param index
     */
    toggleSelect(e, index) {
        let currentData = this.state.currentData.slice();
        currentData[index].selected = !currentData[index].selected;
        this.setState({currentData: currentData});
    }

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
                    {colorRect}
                </td>
            </tr>)
        })
    }

    handleColorScaleChange(scale) {
        let currentData = this.state.currentData.slice();
        currentData.forEach((d, i) => {
            d.color = scale((i * 2 + 1) / (currentData.length * 2 + 1));
        });
        this.setState({ordinalColorScale: scale, currentData: currentData});
    }

    getColorScalePopover() {
        let rectDim = 20;
        const blues = d3ScaleChromatic.schemeBlues[5].map((d, i) => <rect fill={d} width={rectDim} height={rectDim}
                                                                          x={i * rectDim}/>);
        const greens = d3ScaleChromatic.schemeGreens[5].map((d, i) => <rect fill={d} width={rectDim} height={rectDim}
                                                                            x={i * rectDim}/>);
        const greys = d3ScaleChromatic.schemeGreys[5].map((d, i) => <rect fill={d} width={rectDim} height={rectDim}
                                                                          x={i * rectDim}/>);
        const oranges = d3ScaleChromatic.schemeOranges[5].map((d, i) => <rect fill={d} width={rectDim} height={rectDim}
                                                                              x={i * rectDim}/>);
        const purples = d3ScaleChromatic.schemePurples[5].map((d, i) => <rect fill={d} width={rectDim} height={rectDim}
                                                                              x={i * rectDim}/>);
        const reds = d3ScaleChromatic.schemeReds[5].map((d, i) => <rect fill={d} width={rectDim} height={rectDim}
                                                                        x={i * rectDim}/>);
        return <form><FormGroup>
            <Radio onChange={() => this.handleColorScaleChange(d3ScaleChromatic.interpolateGreys)}
                   name="ColorScaleGroup">
                <svg width={rectDim * 5} height={rectDim}>{greys}</svg>
            </Radio>
            <Radio onChange={() => this.handleColorScaleChange(d3ScaleChromatic.interpolateBlues)}
                   name="ColorScaleGroup">
                <svg width={rectDim * 5} height={rectDim}>{blues}</svg>
            </Radio>
            <Radio onChange={() => this.handleColorScaleChange(d3ScaleChromatic.interpolateGreens)}
                   name="ColorScaleGroup">
                <svg width={rectDim * 5} height={rectDim}>{greens}</svg>
            </Radio>
            <Radio onChange={() => this.handleColorScaleChange(d3ScaleChromatic.interpolateOranges)}
                   name="ColorScaleGroup">
                <svg width={rectDim * 5} height={rectDim}>{oranges}</svg>
            </Radio>
            <Radio onChange={() => this.handleColorScaleChange(d3ScaleChromatic.interpolatePurples)}
                   name="ColorScaleGroup">
                <svg width={rectDim * 5} height={rectDim}>{purples}</svg>
            </Radio>
            <Radio onChange={() => this.handleColorScaleChange(d3ScaleChromatic.interpolateReds)}
                   name="ColorScaleGroup">
                <svg width={rectDim * 5} height={rectDim}>{reds}</svg>
            </Radio>
        </FormGroup></form>

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
                                    style={{visibility: this.state.ordinal ? "visible" : "hidden"}}
                                    name="paint-brush"/></OverlayTrigger></th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.displayCategories()}
                        </tbody>
                    </Table>
                    <form>
                        <Button onClick={this.merge}>Merge Selected</Button>
                        {<Checkbox onClick={this.handleConvertToOrdinal}>Convert to ordinal</Checkbox>}
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
