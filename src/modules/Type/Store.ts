import { TSelected } from "modules/TemporalHeatmap/components/StateTransition/CustomGrouping";
import { IPoint, INormPoint } from ".";

export interface VariableStore{
    [key:string]:any
}

export interface IDataStore{
    [key:string]:any,
    currentVariables: string[],
    pointGroups: TSelected,
    points: IPoint[],
    normPoints: INormPoint[]
}