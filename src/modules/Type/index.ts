export interface Point{
    patient: string,
    timeIdx: number,
    value: (number|string|boolean)[],
    [other:string]:any
}

export interface NormPoint extends Point{
    value: number[]
}

export interface ReferencedVariables {
    [variableName:string]:{
        datatype:"BINARY"|"NUMBER"|"STRING",
        domain:string[]|number[]|boolean[],
        [other:string]: any
    }
}

export interface TimePoint {
    heatmap:{data: any[], }[],
    heatmapOrder: string[],
}