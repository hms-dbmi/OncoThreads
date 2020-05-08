export interface Point{
    patient: string,
    timeIdx: number,
    value: number[],
    [other:string]:any
}

export interface ReferencedVariables {
    [variableName:string]:{
        dataType:"BINARY"|"NUMBER"|"STRING",
        domain:string[]|number[]|boolean[],
        [other:string]: any
    }
}