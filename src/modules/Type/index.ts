export type {VariableStore, IDataStore, IPoint, INormPoint, TPointGroups} from './Store'




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

