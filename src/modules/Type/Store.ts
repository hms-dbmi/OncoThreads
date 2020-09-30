import { TSelected } from "modules/TemporalHeatmap/components/CustomGrouping";
import { Point } from ".";

export interface VariableStore{
    [key:string]:any
}

export interface DataStore{
    [key:string]:any,
    currentVariables: string[],
    pointGroups: TSelected,
    points: Point[]
}