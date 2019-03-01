import React from 'react';
import {observer,inject} from 'mobx-react';


const Slider = inject("binningStore")(observer(class Slider extends React.Component {
    /**
     * creats the slider dots and associated lines
     * @returns {Array}
     */
    getSliderEntries() {
        let sliderEntries = [];
        for (let i = 0; i < this.props.binningStore.x.length; i++) {
            sliderEntries.push(<line key={"line" + i} x1={this.props.binningStore.x[i]} x2={this.props.binningStore.x[i]} y1={0}
                                     y2={this.props.yPos} stroke="black"/>);
            sliderEntries.push(<circle key={"circle" + i} fill="darkgrey" cx={this.props.binningStore.x[i]} cy={this.props.yPos}
                                       r={5}
                                       onMouseDown={(e) => this.props.handleMouseDown(e, i)}/>);
        }
        return <g>{sliderEntries}</g>;
    }

    /**
     * creates little textfields for the slider entries to enable specifying values manually
     * @returns {Array}
     */
    getPositionTextfields() {
        let positionText = [];
        this.props.binningStore.x.forEach((d, i)=> {
            positionText.push(
                <foreignObject key={i} x={d} width={75} height={26}>
                    <input onChange={(e) =>this.props.binningStore.handlePositionTextFieldChange(e.target.value,i)}
                           type="text"
                           style={{
                               width: 75 + "px"
                           }} value={this.props.binningStore.textFieldTexts[i]}/>
                </foreignObject>)
        });
        return positionText;

    }

    /**
     * creates the labes for the bins
     * @returns {*}
     */
    getBinLabels() {
        let x = this.props.binningStore.x.slice();
        x.sort(function (a, b) {
            return a - b;
        });
        const yPos = this.props.yPos + 10;
        let textFields = [];
        textFields.push(
            <rect key="rect1" x={0} y={yPos} width={x[0]} height={12} stroke={"black"} strokeWidth={1}
                  fill="white"/>);
        textFields.push(
            <text key="text1" fontSize="10" x={x[0] / 2}
                  y={yPos + 10}>
                1
            </text>);
        x.forEach(function (d, i) {
            if (i + 1 !== x.length) {
                textFields.push(
                    <rect key={"rect" + (i + 2)} x={x[i]} y={yPos} width={x[i + 1] - x[i]} height={12} stroke={"black"}
                          strokeWidth={1}
                          fill="white"/>);
                textFields.push(
                    <text key={"text" + (i + 2)} fontSize="10" x={(x[i] + x[i + 1]) / 2}
                          y={yPos + 10}>
                        {(i + 2)}
                    </text>)
            }
        });
        textFields.push(
            <rect key={"rect" + (x.length + 1)} x={x[x.length - 1]} y={yPos} width={this.props.width - x[x.length - 1]}
                  height={12} stroke={"black"}
                  strokeWidth={1}
                  fill="white"/>);
        textFields.push(
            <text key={"text" + (x.length + 1)} fontSize="10" x={(this.props.width + x[x.length - 1]) / 2}
                  y={yPos + 10}>
                {(x.length + 1)}
            </text>);
        return <g>{textFields}</g>
    }

    /**
     * creates the slider line
     * @returns {*}
     */
    getSliderLine() {
        return (<line x1={0} x2={this.props.width} y1={this.props.yPos} y2={this.props.yPos} stroke={"black"}
                      strokeWidth={3}/>)
    }


    render() {
        console.log(this.props.width);
        const sliderLine = this.getSliderLine();
        const sliderEntries = this.getSliderEntries();
        const binLabels = this.getBinLabels();
        const positionTextFields = this.getPositionTextfields();

        return (
            <g>{sliderLine}
                {sliderEntries}
                {binLabels}
                {positionTextFields}</g>
        )
    }
}));

export default Slider;