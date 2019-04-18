import React from 'react';
import {observer} from 'mobx-react';
import BinaryCombine from "./BinaryCombine";

/**
 * Component for combining variables
 */
const CombineModal = observer(class CombineModal extends React.Component {
    /**
     * get type of combine based on input variables
     * @returns {string} binaryCombine, categoryCombine or numberCombine
     */
    getModificationType() {
        let modificationType;
        if (this.props.variables.filter(d => d.datatype === "BINARY").length === this.props.variables.length) {
            modificationType = "binaryCombine"
        }
        else if (this.props.variables.filter(d => d.datatype === "NUMBER").length === 0) {
            modificationType = "categoryCombine"
        }
        else {
            modificationType = "numberCombine";
        }
        return modificationType;
    }

    render() {
        let modal;
        const modificationType = this.getModificationType();
        switch (modificationType) {
            case "binaryCombine":
                modal = <BinaryCombine variables={this.props.variables}
                                       derivedVariable={this.props.derivedVariable}
                                       modalIsOpen={this.props.modalIsOpen}
                                       closeModal={this.props.closeModal}/>;
                break;
            case "categoryCombine":
                break;
            default:
        }
        return (
            modal
        )
    }
});
export default CombineModal;
