import React from 'react';

import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import {
    LineUp,
    LineUpCategoricalColumnDesc,
    LineUpColumn,
    LineUpNumberColumnDesc,
    LineUpRanking,
    LineUpStringColumnDesc,
    LineUpSupportColumn,
} from 'lineupjsx';
import { ScaleMappingFunction } from 'lineupjs';


/**
 * lineup view
 * TODO: fix lineup bug showing in console when adding scores w/o domain
 */
const LineUpView = inject('rootStore', 'variableManagerStore')(observer(class LineUpView extends React.Component {
    constructor(props) {
        super(props);
        this.lineUpRef = React.createRef();
    }

    componentDidMount() {
        this.updateLineUp();
        this.lineUpRef.current.adapter.data.getFirstRanking().on('removeColumn', (c) => {
            this.props.removeScore(c.desc.column);
        });
    }

    componentDidUpdate(prevProps) {
        // check if the length of the data set has changed
        if (prevProps.data.length !== this.props.data.length) {
            this.updateLineUp();
        }
        if (this.props.addedScores
            .filter(desc => !prevProps.addedScores.includes(desc)).length > 0) {
            this.addScoreColumn();
        }
    }

    /**
     * get columns based on defs
     * @return {(LineUpStringColumnDesc|LineUpCategoricalColumnDesc|LineUpNumberColumnDesc)}
     */
    getColumnDefs() {
        return this.props.columnDefs.map((def) => {
            switch (def.datatype) {
            case 'string':
                return (
                    <LineUpStringColumnDesc
                        width={150}
                        key={def.column}
                        column={def.column}
                        label={def.label}
                    />
                );
            case 'categorical':
                return (
                    <LineUpCategoricalColumnDesc
                        width={150}
                        key={def.column}
                        column={def.column}
                        label={def.label}
                        categories={def.categories}
                    />
                );
            default:
                return (
                    <LineUpNumberColumnDesc
                        width={150}
                        key={def.column}
                        column={def.column}
                        label={def.label}
                        domain={def.domain}
                    />
                );
            }
        });
    }

    /**
     * gets columns that are visible
     * @return {LineUpColumn}
     */
    getVisibleColumns() {
        return this.props.visibleColumns.map(column => (
            <LineUpColumn
                key={column}
                column={column}
            />
        ));
    }

    /**
     * Updates LineUp data and columns
     */
    updateLineUp() {
        this.props.columnDefs.filter(def => def.datatype === 'number' && def.domain.length === 0).forEach((def) => {
            this.updateNumericalColumn(def.column);
        });
        this.lineUpRef.current.adapter.data.setData(this.props.data);
    }

    /**
     * Updates a numerical column in LineUp
     */
    updateNumericalColumn(colDesc) {
        const column = this.lineUpRef.current.adapter.data.find(d => d.desc.type === 'number' && d.desc.column === colDesc);
        if (column !== null) {
            const values = this.props.data.map(d => d[colDesc]).filter(d => !Number.isNaN(d));
            column.setMapping(new ScaleMappingFunction([Math.min(...values), Math.max(...values)], 'linear'));
        }
    }

    addScoreColumn() {
        this.props.addedScores.forEach((columnName) => {
            if (this.lineUpRef.current.adapter.data
                .find(d => d.desc.column === columnName) === null) {
                const columnDesc = this.lineUpRef.current.adapter.data.findDesc(columnName);
                const column = this.lineUpRef.current.adapter.data.create(columnDesc);
                const insertColumn = this.lineUpRef.current.adapter.data.find(d => d.desc.column === 'source');
                if (column !== null) {
                    if (insertColumn !== null) {
                        this.lineUpRef.current.adapter.data.getFirstRanking()
                            .insertAfter(column, insertColumn);
                    } else {
                        this.lineUpRef.current.adapter.data.getFirstRanking().push(column);
                    }
                    if (columnDesc.domain.length === 0) {
                        this.updateNumericalColumn(columnName);
                    }
                }
            }
        });
    }

    handleVariableSelect(s) {
        this.props.handleSelect(s);
    }


    render() {
        return (
            <LineUp
                data={[]}
                ref={this.lineUpRef}
                sidePanel={false}
                onSelectionChanged={(s) => {
                    this.handleVariableSelect(s);
                }}
                selection={this.props.selected}
                style={{ height: '600px' }}
            >
                {this.getColumnDefs()}
                <LineUpRanking>
                    <LineUpSupportColumn type="*" />
                    {this.getVisibleColumns()}
                </LineUpRanking>
            </LineUp>
        );
    }
}));
LineUpView.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    columnDefs: PropTypes.arrayOf(PropTypes.object).isRequired,
    selected: PropTypes.arrayOf(PropTypes.number).isRequired,
    handleSelect: PropTypes.func.isRequired,
    removeScore: PropTypes.func.isRequired,
};
export default LineUpView;
