import UndoRedoStore from "modules/UndoRedoStore";

/**
 * returns scientific notation for high values
 * @param {number} value
 * @returns {number}
 */
const getScientificNotation = (value:number|undefined):number|undefined =>{
    if (value !== undefined) {
        const roundedValue = Math.round(value * 100) / 100;
        if (roundedValue.toString().length < 8) {
            return roundedValue;
        }

        return parseFloat( value.toExponential(2) );
    }
    return value;
}

/**
 * transforms a string to title case
 * @param {string} str
 * @return {string}
 */
const toTitleCase = (str:string):string=> {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).replace('_', ' ');
}

/**
 * checks if a value is or might become a number if more characters are added
 * @param {number} value
 * @returns {boolean}
 */
const isValidValue = (value:any):boolean=> {
    let isValid = false;
    if (!Number.isNaN(value) || value === '.' || value === '-') {
        isValid = true;
    } else {
        const lowerCase = value.toLowerCase();
        if (lowerCase.endsWith('e+')) {
            const substring = lowerCase.substring(0, lowerCase.length - 2);
            isValid = !Number.isNaN(parseFloat(substring)) && !substring.includes('e+');
        } else if (lowerCase.endsWith('e')) {
            const substring = lowerCase.substring(0, lowerCase.length - 1);
            isValid = !Number.isNaN(parseFloat(substring)) && !substring.includes('e');
        }
    }
    return isValid;
}

/**
 * computes the width of a text
 * @param {string} text
 * @param {number} fontSize
 * @returns {number}
 */
const getTextWidth=(text:string|number, fontSize:number, fontWeight:number=400)=>{
    if (typeof(text)=='number') text = text.toString()
    const context = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
    context.font = `${fontWeight} ${fontSize}px Arial`;
    return Math.max(context.measureText(text).width, 0);
}

/**
 * crops the text to a certain width and adds "..." in the end
 * @param {string} text
 * @param {number} fontSize
 * @param {*} fontWeight
 * @param {number} maxWidth
 * @returns {string}
 */
const cropText = (text:string, fontSize:number, fontWeight:number, maxWidth:number):string=> {
    // remove unnecessary 0 after decunak separator. e.g., 12.000=>12
    
    let returnText = text;
    const context = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
    context.font = `${fontWeight} ${fontSize}px Arial`;
    const width = context.measureText(text).width;
    if (width > maxWidth) {
        for (let i = 1; i < text.length; i += 1) {
            const prevText = text.substr(0, i - 1).concat('...');
            const currText = text.substr(0, i).concat('...');
            const prevWidth = context.measureText(prevText).width;
            const currWidth = context.measureText(currText).width;
            if (currWidth > maxWidth && prevWidth < maxWidth) {
                returnText = prevText;
                break;
            }
        }
    }
    return returnText;
}


 const num2letter = (num:number):string => {

    return String.fromCharCode(65 + num)
}

const getUniqueKeyName = (num: number, existingNames: string[]): string => {
    let name = num2letter(num)
    if (existingNames.includes(name)) {
        return getUniqueKeyName(num + 1, existingNames)
    } else return name
}

const  summarizeDomain = (values: string[] | number[] | boolean[]):string[] => {

    if (typeof (values[0]) == "number") {
        let v = values as number[] // stupid typescropt
        
        let range = [Math.min(...v).toPrecision(4), Math.max(...v).toPrecision(4)]
        range=range.map(text => text.replace(/(?<=\.([1-9]*))(0*$)/, ''))
        return range
    } else if (typeof (values[0]) == "string") {
        let v = values as string[]
        return [...new Set(v)]
    } else if (typeof (values[0]) == "boolean") {
        let v = values as boolean[]
        return [...new Set(v)].map(d=>d.toString())
    } else return []
}


export {
    getScientificNotation,
    toTitleCase,
    isValidValue,
    getTextWidth,
    cropText,
    num2letter,
    getUniqueKeyName,
    summarizeDomain
}
