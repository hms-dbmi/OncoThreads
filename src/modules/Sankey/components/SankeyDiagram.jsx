import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';
import {Sankey} from 'react-vis';
import ReactMixins from "../../../utils/ReactMixins.js";
import ToolTip from "./ToolTip.jsx";
import '../../../../node_modules/react-vis/dist/style.css';


const SankeyDiagram = observer(class SankeyDiagram extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: 1000,
            tooltip: {display: false, data: {}},
        };
        ReactMixins.call(this);
        this.showToolTip = this.showToolTip.bind(this);
        this.hideToolTip = this.hideToolTip.bind(this);

    }

    showToolTip(data, e) {
        e.target.setAttribute('opacity', '1');
        this.setState({
            tooltip: {
                display: true,
                data: {
                    source: data.source.name,
                    target: data.target.name,
                    value: data.value
                },
                pos: {
                    x: (data.source.x0+data.target.x1)/2,
                    y: (data.y1+data.y0)/2
                }
            }
        });
    }

    hideToolTip(e) {
        e.target.setAttribute('opacity', '0.7');
        this.setState({tooltip: {display: false, data: {}}});

    }

    render() {
        const margin = {top: 5, right: 50, bottom: 20, left: 50},
            w = this.state.width - (margin.left + margin.right),
            h = this.props.height - (margin.top + margin.bottom);
        const color = d3.scaleOrdinal(d3.schemeCategory10);
        const colorNodes = this.props.data.nodes.map(function (d) {
            const end = d.name.indexOf("(");
            return ({"name": d.name, "color": color(d.name.substr(0, end - 1))});
        });
        const colorLinks = this.props.data.links.map(function (d) {
            return ({"source": d.source, "target": d.target, "value": d.value, "color": "lightgray"})
        });
        return (
            <div>
                <Sankey
                    nodes={colorNodes}
                    links={colorLinks}
                    width={w}
                    height={h}
                    hasVoronoi={false}
                    align="left"
                    nodePadding={20}
                    onLinkMouseOver={(linkdata, event) => {
                        this.showToolTip(linkdata, event);
                    }}
                    onLinkMouseOut={(linkdata, event) => {
                        this.hideToolTip(event)
                    }}
                >
                    <ToolTip tooltip={this.state.tooltip}/>
                </Sankey>

            </div>
        );
    }
});

SankeyDiagram.defaultProps = {
    width: 1000,
    height: 300
};
export default SankeyDiagram;
