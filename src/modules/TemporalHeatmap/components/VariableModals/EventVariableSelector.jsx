import React from 'react';
import {inject, observer} from 'mobx-react';
import {Col, Form, FormControl, FormGroup} from 'react-bootstrap';
import Select from 'react-select';
import OriginalVariable from "../../stores/OriginalVariable";

/**
 * Component for selecting event variables in variable manager
 */
const EventVariableSelector = inject("variableManagerStore", "rootStore")(observer(class EventVariableSelector extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            category: props.eventCategories[0].id,
        };
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.handleCategorySelect = this.handleCategorySelect.bind(this);
    }


    /**
     * creates a searchable list of clinical attributes
     * @returns {Object[]}
     */
    createOptions() {
        let options = [];
        if (this.state.category === "saved") {
            return (this.props.variableManagerStore.savedReferences.map(variableId => {
                let variable = this.props.rootStore.dataStore.variableStores.between.getById(variableId);
                return ({label: variable.name, value: variableId, object: variableId});
            }))
        }
        else if (this.state.category !== "Computed") {
            for (let key in this.props.rootStore.eventAttributes[this.state.category]) {
                let subOptions = [];
                this.props.rootStore.eventAttributes[this.state.category][key].forEach(d => {
                    let option = {
                        label: d.name,
                        value: d.id,
                        object: d,
                    };
                    subOptions.push(option)
                });
                options.push({label: key, options: subOptions})
            }
        }
        else {
            options.push({
                label: "Timepoint Distance",
                value: this.props.rootStore.timeDistanceId,
                object: {
                    id: this.props.rootStore.timeDistanceId,
                    name: "Timepoint Distance",
                    description: "Time between timepoints",
                    datatype: "NUMBER"
                },
                isDisabled: false
            });
        }
        return options;
    }

    /**
     * handles selecting a category
     * @param {event} e
     */
    handleCategorySelect(e) {
        this.setState({
            category: e.target.value,
        });
    }

    /**
     * handles selecting an option
     * @param {Object} selectedOption
     */
    handleOptionSelect(selectedOption) {
        if (!Array.isArray(selectedOption)) {
            if (this.state.category === "saved") {
                this.props.variableManagerStore.addVariableToBeDisplayed(this.props.variableManagerStore.getById(selectedOption.object));
            }
            else if (this.state.category !== "Computed") {
                this.props.variableManagerStore.addVariableToBeDisplayed(new OriginalVariable(selectedOption.object.id, selectedOption.object.name, "BINARY", "Indicates if event: \"" + selectedOption.object.name + "\" has happened between two timepoints", [], [], this.props.rootStore.getSampleEventMapping(this.state.category, selectedOption.object), this.state.category, "event"));
            }
            else {
                this.props.variableManagerStore.addVariableToBeDisplayed(new OriginalVariable(selectedOption.object.id, selectedOption.object.name, selectedOption.object.datatype, selectedOption.object.description, [], [], this.props.rootStore.staticMappers[selectedOption.object.id], "Computed", "computed"));
            }
        }
    }

    /**
     * get Select element for current category
     * @returns {Select}
     */
    getSelect() {
        return <Select
            type="text"
            searchable={true}
            componentClass="select" placeholder="Select..."
            searchPlaceholder="Search variable"
            options={this.createOptions()}
            onChange={this.handleOptionSelect}

        />
    }


    render() {
        let savedOption = null;
        if (this.props.variableManagerStore.savedReferences.length > 0) {
            savedOption = <option value={"saved"} key={"saved"}>Saved variables</option>
        }
        return (<Form horizontal>
                <h4>Select variable</h4>
                <FormGroup>
                    <Col sm={4} style={{paddingRight: "0"}}>
                        <FormControl style={{height: 38}} componentClass="select"
                                     onChange={this.handleCategorySelect}
                                     placeholder="Select Category">
                            {this.props.eventCategories.map((d) => <option value={d.id} key={d.id}>{d.name}</option>)}
                            {savedOption}
                        </FormControl>
                    </Col>
                    <Col sm={8} style={{padding: 0}}>
                        {this.getSelect()}
                    </Col>
                </FormGroup>
            </Form>
        )
    }
}));
export default EventVariableSelector;
