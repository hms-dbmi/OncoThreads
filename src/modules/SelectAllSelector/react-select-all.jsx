/**
 * Created by theresa on 30.01.18.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

/**
 * Wrapper for Select component to allow select all
 */
const SelectAll = class SelectAll extends React.Component {
    /**
     * flattens hierarchical options
     * @param {Object[]} options
     * @return {Array} flattened options
     */
    flattenOptions(options) {
        let flattened = [];
        options.forEach((element) => {
            if (Object.prototype.hasOwnProperty.call(element, 'options')) {
                this.flattenOptions(element.options);
            }
            flattened = flattened.concat(element.options);
        });
        return flattened;
    }

    render() {
        const flattenedOptions = this.flattenOptions(this.props.options);
        if (this.props.allowSelectAll) {
            if (this.props.value.length === flattenedOptions.length) {
                return (
                    <Select
                        {...this.props}
                        value={[this.props.allOption]}
                        onChange={(selected) => {
                            this.props.onChange(selected.slice(1));
                        }}
                    />
                );
            }
        }
        return (
            <Select
                {...this.props}
                options={[this.props.allOption, ...this.props.options]}
                onChange={(selected) => {
                    if (selected.length > 0
                        && selected[selected.length - 1].value === this.props.allOption.value) {
                        return this.props.onChange(flattenedOptions);
                    }
                    return this.props.onChange(selected);
                }}
            />
        );
    }
};
SelectAll.propTypes = {
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    value: PropTypes.any.isRequired,
    onChange: PropTypes.func.isRequired,
    allowSelectAll: PropTypes.bool.isRequired,
    allOption: PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string,
    }),
};

SelectAll.defaultProps = {
    allOption: {
        label: 'Select all',
        value: '*',
    },
};

export default SelectAll;
