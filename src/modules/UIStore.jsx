import { action, extendObservable } from 'mobx';

/**
 * store for storing the UI state
 */

class UIStore {
    constructor() {
        extendObservable(this, {
            cBioInstance: 'hack', // hack, portal, own
            continuousRepresentation: 'gradient', // gradient, boxplot, medium
            realTime: false, // show realtime lines in block view
            globalTime: false, // show global timeline
            advancedSelection: true, // advanced selection enables
            showUndefined: true, // show rows with only undefined values
            slantedLines: 'none', // altWithin, altAcross, none, random
            blockAlignment: 'left', // left middle, right
            rowOffset: 0,
            horizontalStacking: false,
            horizontalGap: 1,
            setCBioInstance: action((instance) => {
                this.cBioInstance = instance;
            }),
            setContinuousRepresentation: action((representation) => {
                this.continuousRepresentation = representation;
            }),
            setRealTime: action((boolean) => {
                this.realTime = boolean;
            }),
            setGlobalTime: action((key) => {
                this.globalTime = key;
            }),
            setAdvancedSelection: action((boolean) => {
                this.advancedSelection = boolean;
            }),
            setShowUndefined: action((boolean) => {
                this.showUndefined = boolean;
            }),
            setSlantedLines: action((slantedLines) => {
                this.slantedLines = slantedLines;
            }),
            setHorizontalStacking: action((isHorizontal) => {
                this.horizontalStacking = isHorizontal;
            }),
            setBlockAlignment: action((blockAlignment) => {
                this.blockAlignment = blockAlignment;
            }),
            setRowOffset: action((offset) => {
                this.rowOffset = Number(offset);
            }),
            setHorizontalGap: action((horizontalGap) => {
                this.horizontalGap = Number(horizontalGap);
            }),
        });
    }
}

export default UIStore;
