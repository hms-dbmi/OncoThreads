
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

export interface IDataStore{
    [key:string]:any,
    currentVariables: string[],
    pointGroups: TPointGroups,
    points: IPoint[],
    normPoints: INormPoint[]
}