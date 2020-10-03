export type {VariableStore, IDataStore} from './Store'


export interface IPoint{
    idx:number,
    patient: string,
    timeIdx: number,
    value: (number|string|boolean)[],
    [other:string]:any
}

export interface INormPoint extends IPoint{
    pos: number[]
}

export interface ReferencedVariables {
    [variableName:string]:{
        datatype:"BINARY"|"NUMBER"|"STRING",
        domain:string[]|number[]|boolean[],
        [other:string]: any
    }
}

export interface TimePoint {
    heatmap:HeatMap[],
    heatmapOrder: string[],
    type:'between'|'sample',
    isGrouped:boolean,
    [other:string]:any // **TODO**
}
export interface HeatMap{
    data: {patient:string, sample:string, value:string}[],
    variable:string, // attribute name
    isUndef: boolean
}

