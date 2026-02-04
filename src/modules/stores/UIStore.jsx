import { makeObservable, observable, action } from 'mobx';
import * as introJs from 'intro.js'

/**
 * store for storing the UI state
 */

class UIStore {
    introTutorial = undefined; // whether is in the tutorial mode
    cBioInstance = 'hack'; // hack, portal, own
    continuousRepresentation = 'gradient'; // gradient, boxplot, medium
    realTime = false; // show realtime lines in block view
    selectedTab = 'stateTransition'; // show global timeline
    advancedSelection = true; // advanced selection enables
    showUndefined = true; // show rows with only undefined values
    slantedLines = 'none'; // altWithin, altAcross, none, random
    blockAlignment = 'left'; // left middle, right
    rowOffset = 0;
    horizontalStacking = false;
    horizontalGap = 1;
    selectedPatientGroupIdx = [0];

    constructor() {
        makeObservable(this, {
            introTutorial: observable,
            cBioInstance: observable,
            continuousRepresentation: observable,
            realTime: observable,
            selectedTab: observable,
            advancedSelection: observable,
            showUndefined: observable,
            slantedLines: observable,
            blockAlignment: observable,
            rowOffset: observable,
            horizontalStacking: observable,
            horizontalGap: observable,
            selectedPatientGroupIdx: observable,
            setCBioInstance: action,
            setContinuousRepresentation: action,
            setRealTime: action,
            selectTab: action,
            setAdvancedSelection: action,
            setShowUndefined: action,
            setSlantedLines: action,
            setHorizontalStacking: action,
            setBlockAlignment: action,
            setRowOffset: action,
            setHorizontalGap: action,
            selectPatientGroup: action,
            setTutorialMode: action,
        });
    }

    setCBioInstance = (instance) => {
        this.cBioInstance = instance;
    };

    setContinuousRepresentation = (representation) => {
        this.continuousRepresentation = representation;
    };

    setRealTime = (boolean) => {
        this.realTime = boolean;
    };

    selectTab = (key) => {
        this.selectedTab = key;
    };

    setAdvancedSelection = (boolean) => {
        this.advancedSelection = boolean;
    };

    setShowUndefined = (boolean) => {
        this.showUndefined = boolean;
    };

    setSlantedLines = (slantedLines) => {
        this.slantedLines = slantedLines;
    };

    setHorizontalStacking = (isHorizontal) => {
        this.horizontalStacking = isHorizontal;
    };

    setBlockAlignment = (blockAlignment) => {
        this.blockAlignment = blockAlignment;
    };

    setRowOffset = (offset) => {
        this.rowOffset = Number(offset);
    };

    setHorizontalGap = (horizontalGap) => {
        this.horizontalGap = Number(horizontalGap);
    };

    selectPatientGroup = (groupIdx) => {
        let idx = this.selectedPatientGroupIdx.indexOf(groupIdx)
        if (idx === -1) {
            this.selectedPatientGroupIdx.push(groupIdx)
        } else {
            this.selectedPatientGroupIdx.splice(idx, 1)
        }
    };

    setTutorialMode = (isIn) => {
        if (isIn) {
            if (this.introTutorial === undefined) {
                this.introTutorial = introJs()
                this.introTutorial.oncomplete(() => {
                    this.introTutorial = undefined
                })
                this.introTutorial.onexit(() => {
                    this.introTutorial = undefined
                })

                this.introTutorial.setOption('showStepNumbers', false)
            }

            this.introTutorial.start()
        }

        if (isIn === false && this.introTutorial !== undefined) {
            this.introTutorial.exit()
            this.introTutorial = undefined
        }
    };
}

export default UIStore;
