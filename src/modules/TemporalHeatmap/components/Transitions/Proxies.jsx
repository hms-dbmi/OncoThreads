import React from 'react';
import {inject, observer} from 'mobx-react';
import uuidv4 from "uuid/v4";


/**
 * Creates proxies for variables and bands
 */
const Proxies = inject("visStore", "uiStore")(observer(class Proxies extends React.Component {

    /**
     * creates a band proxy
     * @param {Object} partition
     * @param {number} y0
     * @param {number} y1
     * @return {rect|path}
     */
    getBandProxy(partition, y0, y1) {
        let proxy;
        if (partition.width === partition.sharedWidth) {
            proxy = <rect key={partition.key+"band"} x={partition.x0} y={this.props.bandRectY} width={partition.width}
                      height={this.props.visStore.bandRectHeight}
                      fill={"#dddddd"} opacity={0.5}/>
        }
        else {
            proxy = <path key={partition.key+"band"} d={"M" + partition.x0 + "," + y1
                + "L" + (partition.x0 + partition.sharedWidth) + "," + y1
                + "C" + (partition.x0 + partition.sharedWidth) + "," + y0
                + " " + (partition.x0 + partition.sharedWidth) + "," + y1
                + " " + (partition.x0 + partition.width) + "," + y0
                + "L" + partition.x0 + "," + y0 + "Z"}
                      fill={"#dddddd"} opacity={0.5}/>
        }
        return proxy;
    }

    /**
     * gets the outlines of the band proxies
     * @param {key} partition
     * @param {number} y0
     * @param {number} y1
     * @return {*[]}
     */
    getBandOutlines(partition, y0, y1) {
        let outlines=[];
        if (partition.width === partition.sharedWidth) {
            outlines = [<line key="line1" x1={partition.x0} x2={partition.x0} y1={this.props.bandRectY}
                      y2={this.props.bandRectY + this.props.visStore.bandRectHeight} stroke="#cccccc" opacity={0.5}/>,
                <line key="line2" x1={partition.x0 + partition.width} x2={partition.x0 + partition.width} y1={this.props.bandRectY}
                      y2={this.props.bandRectY + this.props.visStore.bandRectHeight} stroke="#cccccc" opacity={0.5}/>]
        }
        else {
            outlines =[<path key="line1" d={"M" + (partition.x0 + partition.sharedWidth) + "," + y1
                + "C" + (partition.x0 + partition.sharedWidth) + "," + y0
                + " " + (partition.x0 + partition.sharedWidth) + "," + y1
                + " " + (partition.x0 + partition.width) + "," + y0}
                      stroke={"#cccccc"} fill="none" opacity={0.5}/>,
                <path key="line2" d={"M" + partition.x0 + "," + y0
                + "L" + partition.x0 + "," + y1}
                      stroke={"#cccccc"} fill="none" opacity={0.5}/>]
        }
        return outlines;
    }

    /**
     * creates a variable proxy
     * @param {number} x
     * @param {number} width
     * @param {string} key
     * @return {rect}
     */
    getVariableProxy(x, width, key) {
        return <rect key={key+"_varProxy"}
            x={x}
                     y={this.props.colorRectY}
                     width={width}
                     height={this.props.visStore.colorRectHeight}
                     fill={this.props.colorScale(key)}/>
    }


    render() {
        let proxies = [];
        let y0, y1;
        if (!this.props.inverse) {
            y0 = this.props.bandRectY;
            y1 = this.props.bandRectY + this.props.visStore.bandRectHeight;
        }
        else {
            y1 = this.props.bandRectY;
            y0 = this.props.bandRectY + this.props.visStore.bandRectHeight;
        }
        this.props.proxyPositions.forEach((partition,i) => {
            let bandProxy, variableProxy, bandOutlines;
            if (!this.props.uiStore.horizontalStacking) {
                variableProxy = this.getVariableProxy(partition.x0, partition.width, partition.key);
            }
            let lastVal = partition.x0;
            let d = "M" + partition.x0 + "," + y0;
            const rawProxy = this.getBandProxy(partition, y0, y1);
            bandOutlines = this.getBandOutlines(partition, y0, y1);
            if (partition.selected.length > 0) {
                partition.selected.forEach((selected, i) => {
                    if (i === 0) {
                        d += "C" + selected[0] + "," + y1
                            + " " + selected[0] + "," + y0
                            + " " + selected[0] + "," + y1
                            + "L" + selected[1] + "," + y1;
                    }
                    else {
                        d += "L" + selected[0] + "," + y1
                            + "L" + selected[1] + "," + y1;
                    }
                    lastVal = selected[1];
                });
                d += "C" + lastVal + "," + y0
                    + " " + lastVal + "," + y1
                    + " " + (partition.x0 + partition.width) + "," + y0;
                const id = uuidv4();
                bandProxy = [<defs key={partition.key+"defs"}>
                        <mask id={id}>
                            {rawProxy}
                            <path d={d} fill={"white"}/>
                        </mask>
                    </defs>,
                    <rect key={partition.key+"element"} x={partition.x0} y={this.props.bandRectY} width={partition.width}
                          height={this.props.visStore.bandRectHeight}
                          fill={"#afafaf"} opacity={0.5}
                          mask={"url(#" + id + ")"}/>,
                    bandOutlines];
            }
            else {
                bandProxy = [rawProxy,bandOutlines];
            }
            proxies.push(<g key={partition.key}>{bandProxy}{variableProxy}</g>)
        });
        return <g>{proxies}</g>;
    }
}));
export default Proxies;