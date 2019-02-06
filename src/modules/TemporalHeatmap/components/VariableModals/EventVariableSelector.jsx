import React from 'react';
import {observer} from 'mobx-react';
import {Col, Form, FormControl, FormGroup} from 'react-bootstrap';
import Select from 'react-select';


const EventVariableSelector = observer(class EventVariableSelector extends React.Component {

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
     * @returns {Array}
     */
    createOptions() {
        let options = [];
            if(this.state.category==="saved"){
            return(this.props.savedReferences.map(variableId=>{
                let variable= this.props.store.dataStore.variableStores.between.getById(variableId);
                return({label:variable.name,value:variableId,object:variableId});
            }))
        }
        else if (this.state.category !== "Computed") {
            for (let key in this.props.eventAttributes[this.state.category]) {
                let subOptions = [];
                this.props.eventAttributes[this.state.category][key].forEach(d => {
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
                value: this.props.store.timeDistanceId,
                object: {
                    id: this.props.store.timeDistanceId,
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
     * @param e
     */
    handleCategorySelect(e) {
        this.setState({
            category: e.target.value,
        });
    }

    /**
     * handles selecting an option
     * @param selectedOption
     */
    handleOptionSelect(selectedOption) {
        if (!Array.isArray(selectedOption)) {
             if(this.state.category==="saved"){
                this.props.handleSavedVariableAdd(selectedOption.object);
            }
            else if (this.state.category !== "Computed") {
                this.props.addEventVariable(selectedOption.object, this.state.category);
            }
            else {
                this.props.addTimepointDistance(selectedOption.object);
            }
        }
    }

    /**
     * get Select element for current category
     * @returns {*}
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
        let savedOption=null;
        if(this.props.savedReferences.length>0){
            savedOption=<option value={"saved"} key={"saved"}>Saved variables</option>
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
});
export default EventVariableSelector;
