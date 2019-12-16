import React from "react";
import {observer,inject} from "mobx-react";
import * as d3 from "d3";
//import ReactDOM from 'react-dom';
import { extendObservable } from 'mobx';


import TimeVarModal from './TimeVarModal';
/*
 * Axis for showing the time scale in the global timeline
 * TODO: Make more react like (see Axis in VariableModals/ModifySingleVariables/Binner)
 */
const GlobalTimeAxis = inject("rootStore")(observer(class GlobalTimeAxis extends React.Component {

    
    constructor(){
        super();
        extendObservable(this, {
            
            timeVarModalOpen: false,
        });

        this.openTimeVarModal = this.openTimeVarModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }



    componentDidUpdate() {
        this.renderAxis();
        //this.getTimeVarModal();
    }

    componentDidMount() {
        this.renderAxis();
        //this.getTimeVarModal();
    }

    make_y_gridlines(yAxis) {
        return yAxis; //d3.axisLeft().scale(y);
    }


    openTimeVarModal(){
        this.timeVarModalOpen = true;      
    }


    closeModal(){
        this.timeVarModalOpen = false;
    }

    /**
     * gets binning modal
     * @returns {(GroupBinningModal|null)}
     */
    getTimeVarModal() {
        if (this.timeVarModalOpen) {
            return (
                <TimeVarModal
                    modalIsOpen={this.timeVarModalOpen}
                    closeModal={this.closeModal}
                    rootStore={this.props.rootStore}
                />
            );
        }

        return null;
    }

    renderAxis() {

        const self=this;

        var timeV = this.props.rootStore.maxTimeInDays / this.props.rootStore.timeVar;
        const y = d3.scaleLinear().domain([0, timeV]).range([0, this.props.rootStore.visStore.svgHeight - 35]).nice();


        const yAxis = d3.axisLeft().scale(y);
        //.scale(y);
        //.ticks(5);

        //const node = ReactDOM.findDOMNode(this);
        //d3.select(node).call(yAxis);
        d3.select(".axisGlobal").call(yAxis);

        d3.selectAll(".axisLabel").remove();

        let text_var=this.props.rootStore.timeValue;

        if(text_var==='days'){
            text_var='Days';
        }
        else if(text_var==='months'){
            text_var='Months';
        }
        else if(text_var==='years'){
            text_var='Years';
        }

        d3.select(".axisGlobal")
            .append("text")
            .attr("class", "axisLabel")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -1 * this.props.rootStore.visStore.svgHeight / 4)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style("font-family", "times")
            .style("font-size", "12px")
            .style("stroke-width", 0.5)
            .style("stroke", "black")
            .style("fill", "black")
            .text(text_var);
        d3.select(".axisGlobal")
            .append("text")
            .attr("class", "axisLabel fa")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -1 * this.props.rootStore.visStore.svgHeight / 4 +20)
            .attr("dy", "1em")
            //.style("font-family", "FontAwesome")
            .style("font-size", "9px")
            .style("text-anchor", "end")
            .style("stroke-width", 1)
            .style("stroke", "black")
            .text("\uf013")
            .on("click", function(d){
                self.openTimeVarModal();
              });



    }

    render() {
        return (
            <div>
                <svg height={this.props.rootStore.visStore.svgHeight} width={this.props.width}>
                    <g className="axisGlobal"
                       transform={"translate(50," + this.props.rootStore.visStore.timelineRectSize / 2 + ")"}>
                    </g>

                    
                </svg>

                {this.getTimeVarModal()}
            </div>
        );
    }
}));


export default GlobalTimeAxis;
