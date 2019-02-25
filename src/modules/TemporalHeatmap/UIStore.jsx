import {action, extendObservable} from "mobx";

/*
stores current UI state
 */
class UIStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        extendObservable(this, {
            continuousRepresentation: 'gradient', //gradient/ boxplot/ medium
            realTime: false,
            globalTime: false,
            advancedSelection: true,
            showUndefined: true,
            setContinuousRepresentation: action(representation => {
               this.continuousRepresentation=representation;
            }),
            setRealTime:action(boolean=>{
                this.realTime=boolean;
            }),
            setGlobalTime:action(boolean=>{
                this.globalTime=boolean;
            }),
            setAdvancedSelection:action(boolean=>{
                this.advancedSelection=boolean;
            }),
            setShowUndefined:action(boolean=>{
                this.showUndefined=boolean
            })
        })


    }
}
export default UIStore;