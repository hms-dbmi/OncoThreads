import React from 'react';
import {observer} from 'mobx-react';
import Binner from './Binner';
import * as d3 from 'd3';
import {Button, ControlLabel, FormControl, FormGroup, Modal, OverlayTrigger, Popover, Radio} from "react-bootstrap";
import FontAwesome from 'react-fontawesome';
import Histogram from "./Histogram";
import DerivedVariable from "../../../DerivedVariable";
import uuidv4 from "uuid/v4";
import MapperCombine from "../../../MapperCombineFunctions";


const ContinuousModificationModal = observer(class ContinuousModificationModal extends React.Component {
    constructor(props) {
        super(props);
        this.data = Object.values(props.variable.mapper);
        this.state = {
            bins: this.getInitialBins(),
            binNames: ["Bin 1", "Bin 2"],
            name: props.variable.name,
            colorRange: props.variable.colorRange,
            transformXFunction: d3.scaleLinear(),
            isXLog: false,
            bin: false,
        };
        this.setXScaleType = this.setXScaleType.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleBinChange = this.handleBinChange.bind(this);
        this.toggleBinningActive = this.toggleBinningActive.bind(this);
        this.handleBinNameChange = this.handleBinNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * handles the name change
     * @param event
     */
    handleNameChange(event) {
        this.setState({name: event.target.value});
    }

    handleBinChange(bins) {
        this.setState({bins: bins});
    }

    handleBinNameChange(binNames) {
        this.setState({binNames: binNames});
    }

    getInitialBins() {
        let min = d3.min(this.data);
        let max = d3.max(this.data);

        let med = (d3.max(this.data) + d3.min(this.data)) / 2;
        return [min, med, max];
    }

    setXScaleType(event) {
        let scale, isLog;
        if (event.target.value === 'linear') {
            isLog = false;
            scale = function (d) {
                return d;
            };
        }
        else {
            isLog = true;
            scale = function (d) {
                return Math.log10(d + 1);
            };
        }
        this.setState({transformXFunction: scale, isXLog: isLog});
    }


    close() {
        this.props.closeModal();
    }


    /**
     * applies binning to data and color scales
     */
    handleApply() {
        const newId = uuidv4();
        let modification = {
            logTransform: this.state.isXLog ? this.state.transformXFunction : false, binning: this.state.bin ? {
                bins: this.state.bins,
                binNames: this.state.binNames
            } : false
        };
        let derivedVariable;
        if (this.state.bin) {
            derivedVariable = new DerivedVariable(newId, this.state.name, "BINNED", this.props.variable.description + " (binned)", [this.props.variable.id], "continuousTransform", modification, this.state.colorRange, this.state.binNames, MapperCombine.getModificationMapper("continuousTransform", modification, [this.props.variable.mapper]));
        }
        else {
            derivedVariable = new DerivedVariable(newId, this.state.name, "NUMBER", this.props.variable.description, [this.props.variable.id], "continuousTransform", modification, this.state.colorRange, [], MapperCombine.getModificationMapper("continuousTransform", modification, [this.props.variable.mapper]));
        }
        this.props.callback(derivedVariable);
        this.props.closeModal();
    }

    getRadio() {
        let disabled = false;
        if (d3.min(this.data) < 0) {
            disabled = true;
        }
        return (<FormGroup>
            <Radio defaultChecked onClick={this.setXScaleType} disabled={disabled} value={'linear'} name="XradioGroup"
                   inline>
                None
            </Radio>{' '}
            <Radio onClick={this.setXScaleType} value={'log'} disabled={disabled} name="XradioGroup" inline>
                Log
            </Radio>{' '}
        </FormGroup>);


    }


    getBinning() {
        const width = 350;
        const height = 200;
        let data = this.data.map(d => this.state.transformXFunction(d));
        const min = Math.min(...data);
        const max = Math.max(...data);
        let xScale = d3.scaleLinear().domain([min, max]).range([0, width]);
        const bins = d3.histogram()
            .domain([min, max])
            .thresholds(xScale.ticks(30))(data);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, function (d) {
                return d.length;
            })]).range([height, 0]);
        if (this.state.bin) {
            return <Binner data={data}
                           variable={this.props.variable}
                           isXLog={this.state.isXLog}
                           bins={this.state.bins}
                           binNames={this.state.binNames}
                           xScale={xScale}
                           yScale={yScale}
                           width={width}
                           height={height}
                           histBins={bins}
                           handleBinChange={this.handleBinChange}
                           handleBinNameChange={this.handleBinNameChange}/>
        }
        else {
            const margin = {top: 20, right: 20, bottom: 90, left: 50},
                w = width + (margin.left + margin.right),
                h = height + (margin.top + margin.bottom);
            const transform = 'translate(' + margin.left + ',' + margin.top + ')';
            return <svg width={w} height={h}>
                <g transform={transform}><Histogram bins={bins} xScale={xScale} yScale={yScale}
                                                    h={height}
                                                    w={width} xLabel={this.props.variable.name}
                                                    numValues={data.length}/></g>
            </svg>
        }
    }

    toggleBinningActive() {
        this.setState({bin: !this.state.bin});
    }

    getBinButton() {
        if (this.state.bin) {
            return <Button onClick={this.toggleBinningActive} bsStyle="primary">{"<< Cancel Binning"}</Button>
        }
        else {
            return <Button onClick={this.toggleBinningActive} bsStyle="primary">{"Bin >>"}</Button>

        }
    }

    handleOverlayClick(event) {
        event.stopPropagation();
        document.body.click();
    }

    static getGradient(range, width, height, steps) {
        let intermediateStop = null;
        if (steps === 3) {
            intermediateStop = <stop offset="50%" style={{stopColor: range[1]}}/>;
        }
        let randomId = uuidv4();
        return <g>
            <defs>
                <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: range[0]}}/>
                    {intermediateStop}
                    <stop offset="100%" style={{stopColor: range[range.length - 1]}}/>
                </linearGradient>
            </defs>
            <rect width={width} height={height} fill={"url(#" + randomId + ")"}/>
        </g>;
    }

    getColorScalePopover() {
        let steps = 2;
        const width = 100;
        const height = 20;
        let linearColorRange = [];
        if (Math.min(...this.data) < 0) {
            steps = 3;
            linearColorRange = [
                ['#0571b0', '#f7f7f7', '#ca0020'],
                ['#08ff00', '#000000', '#ff0000']
            ]
        }
        else {
            linearColorRange = [
                ['rgb(214, 230, 244)', 'rgb(8, 48, 107)'],
                ['rgb(218, 241, 213)', 'rgb(0, 68, 27)'],
                ['rgb(232, 232, 232)', 'rgb(0, 0, 0)'],
                ['rgb(254, 222, 191)', 'rgb(127, 39, 4)'],
                ['rgb(232, 230, 242)', 'rgb(63, 0, 125)'],
                ['rgb(253, 211, 193)', 'rgb(103, 0, 13)'],
            ]

        }
        return <form>
            <FormGroup>
                {linearColorRange.map((d, i) => <Radio key={i} onChange={() => this.handleColorScaleChange(d)}
                                                        name="ColorScaleGroup">
                    <svg width={width}
                         height={height}>{ContinuousModificationModal.getGradient(d, width, height, steps)}</svg>
                </Radio>)}
            </FormGroup>
        </form>
    }

    handleColorScaleChange(scale,) {
        this.setState({colorRange: scale});
    }

    render() {
        const colorScalePopOver = <Popover id="popover-positioned-right" title="Choose color scale">
            {this.getColorScalePopover()}
        </Popover>;
        return (
            <Modal show={this.props.modalIsOpen}
                   onHide={this.close}>
                <Modal.Header>
                    <Modal.Title>Modify continuous variable</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <ControlLabel>Variable name<OverlayTrigger rootClose={true}
                                                                   onClick={(e) => this.handleOverlayClick(e)}
                                                                   trigger="click"
                                                                   placement="right"
                                                                   overlay={colorScalePopOver}><FontAwesome
                            name="paint-brush"/></OverlayTrigger></ControlLabel>
                        <FormControl
                            type="text"
                            value={this.state.name}
                            onChange={this.handleNameChange}/>
                    </form>
                    <h5>Description</h5>
                    <p>{this.props.variable.description}</p>
                    <form>
                        <ControlLabel>Transform data</ControlLabel>
                        {this.getRadio()}
                    </form>
                    {this.getBinning()}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.close}>
                        Cancel
                    </Button>
                    {this.getBinButton()}
                    <Button onClick={() => this.handleApply()}>
                        Apply

                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default ContinuousModificationModal;