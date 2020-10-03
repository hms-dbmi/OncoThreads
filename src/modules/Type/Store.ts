
export type TPointGroups = { [stateKey: string]: { stateKey: string, pointIdx: number[] } }


export interface VariableStore{
    [key:string]:any
}
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

export interface TimePoint {
    heatmap:HeatMap[],
    heatmapOrder: string[],
    type:'between'|'sample',
    isGrouped:boolean,
    customGrouped: Array<{patients:string[], partition: any, [key:string]:any}>,
    [other:string]:any // **TODO**
}

export interface ReferencedVariables {
    [variableName:string]:{
        datatype:"BINARY"|"NUMBER"|"STRING",
        domain:string[]|number[]|boolean[],
        [other:string]: any
    }
}


export interface HeatMap{
    data: {patient:string, sample:string, value:string}[],
    variable:string, // attribute name
    isUndef: boolean
}


export interface IDataStore{
    [key:string]:any,
    currentVariables: string[],
    pointGroups: TPointGroups,
    points: IPoint[],
    normPoints: INormPoint[],
    timepoints: TimePoint[],
    
}