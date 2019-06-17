import {action, extendObservable} from "mobx";

/**
 * store for storing the UI state
 */
class UIStore {
    constructor() {
        extendObservable(this, {
            continuousRepresentation: 'gradient', //gradient, boxplot, medium
            realTime: false, // show realtime lines in block view
            globalTime: false, // show global timeline
            advancedSelection: true, // advanced selection enables
            showUndefined: true, // show rows with only undefined values
            slantedLines:'none', //altWithin, altAcross, none, random
            horizontalStacking:false,
            setContinuousRepresentation: action(representation => {
                this.continuousRepresentation = representation;
            }),
            setRealTime: action(boolean => {
                this.realTime = boolean;
            }),
            setGlobalTime: action(boolean => {
                this.globalTime = boolean;
            }),
            setAdvancedSelection: action(boolean => {
                this.advancedSelection = boolean;
            }),
            setShowUndefined: action(boolean => {
                this.showUndefined = boolean
            }),
            setSlantedLines: action(slantedLines=>{
                this.slantedLines=slantedLines;
            }),
            setHorizontalStacking:action(isHorizontal=>{
                this.horizontalStacking=isHorizontal;
            })
        })
    }
}
export default UIStore;