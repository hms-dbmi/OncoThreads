import * as React from "react"
import * as d3 from "d3"
import { observer, inject} from 'mobx-react';
import { IDataStore } from "modules/Type";
import { getColorByName} from 'modules/TemporalHeatmap/UtilityClasses/'

interface Props{
    rootStore?:any,
    overviewWidth:number,
}

type TypeLayoutDict = Array<{[key:string]:{
    width:number,
    x: number,
}}>

@inject('rootStore')
@observer
class TransitionOverview extends React.Component<Props> {
    timeStepHeight = 65;
    rectHeight = 20;
    padding = 20;
    partitionGap = 15;
    linkMaxWidth = 20;
    paddingW = 5; paddingH = 10; annotationWidth = 40;
    stateOverview() {
        let timepoints: Array<JSX.Element>= [], transitions: Array<JSX.Element> = [], annotations: Array<JSX.Element> = [];
        let dataStore  = this.props.rootStore!.dataStore as IDataStore
        let rectWidthScale = d3.scaleLinear()
            .domain([0, dataStore.numberOfPatients])
            .range([0, this.props.overviewWidth - (dataStore.maxTPPartitions - 1) * this.partitionGap - 2 * this.paddingW - this.annotationWidth]);

        let layoutDict: TypeLayoutDict = []
        let samplePoints = dataStore.timepoints
            .filter(d => d.type === "sample")

        // draw timepoints
        samplePoints.forEach((d, i) => {

            const transformTP = `translate(
                    ${0},
                    ${this.paddingH + i * this.timeStepHeight}
                    )`;
            let offsetX = this.paddingW + this.annotationWidth, gap = this.partitionGap;
            let timepoint: Array<JSX.Element> = []
            layoutDict.push({})

            d.customGrouped.forEach(d => {
                let stateKey = d.partition || ''
                let patients = d.patients
                let rectWidth = rectWidthScale(patients.length)
                timepoint.push(<rect fill={getColorByName(stateKey)} width={rectWidth} height={this.rectHeight} x={offsetX} key={`time${i}state${stateKey}`} />)

                layoutDict[i][stateKey] = {
                    width: rectWidth,
                    x: offsetX
                }

                offsetX += rectWidth + gap
            })
            timepoints.push(
                <g key={d.globalIndex} transform={transformTP}>
                    {timepoint}
                </g>,
            )
        });



        // draw transitions
        let linkGene = d3.linkVertical().x(d => d[0]).y(d => d[1])
        let linkWidthScale = d3.scaleLinear().domain([0, dataStore.numberOfPatients]).range([1, this.linkMaxWidth])

        samplePoints.forEach((d, i) => {
            if (i !== samplePoints.length - 1) {
                let firstTP = d,
                    secondTP = samplePoints[i + 1];
                let firstGrouped = firstTP.customGrouped,
                    secondGrouped = secondTP.customGrouped
                firstGrouped.forEach((group1) => {
                    secondGrouped.forEach((group2) => {
                        let { patients: patients1, partition: partition1 } = group1, { patients: patients2, partition: partition2 } = group2
                        let transPatients = patients1.filter(d => patients2.includes(d))
                        if (transPatients.length > 0) {

                            let layoutDict1 = layoutDict[i][partition1], layoutDict2 = layoutDict[i + 1][partition2]
                            let sourceX = layoutDict1.x + layoutDict1.width / 2,
                                sourceY = this.paddingH + i * this.timeStepHeight + this.rectHeight,
                                targetX = layoutDict2.x + layoutDict2.width / 2,
                                targetY = this.paddingH + (i + 1) * this.timeStepHeight
                            transitions.push(<path key={`time_${i}to${i + 1}_trans_${partition1}_${partition2}`}
                                d={linkGene({
                                    source: [sourceX, sourceY], target: [targetX, targetY]
                                })!}
                                fill="none"
                                stroke="lightgray"
                                strokeWidth={linkWidthScale(transPatients.length)}
                            />)
                        }
                    })
                })
            }
        })

        // draw timepoint icon
        const iconR = 10

        annotations.push(
            <line key="timeline"
                x1={this.paddingW + iconR} x2={this.paddingW + iconR}
                y1={this.paddingH} y2={this.paddingH + this.timeStepHeight * (samplePoints.length - 1)}
                stroke="gray"
            />)

        samplePoints.forEach((d, i) => {

            const transformTP = `translate(
                    ${this.paddingW},
                    ${this.paddingH + i * this.timeStepHeight}
                    )`;

            annotations.push(
                <g key={d.globalIndex} transform={transformTP}>
                    <circle cx={iconR} cy={iconR} r={iconR} fill="white" stroke="gray" />
                    <text x={iconR} y={iconR * 1.4} textAnchor="middle">{i}</text>
                </g>,
            )
        });


        return [annotations, transitions, timepoints];
    }

    render(){
        return this.stateOverview()
    }
}

export default TransitionOverview