/**
 * class for commonly used static functions
 */
class UtilityFunctions {
    /**
     * returns scientific notation for high values
     * @param {number} value
     * @returns {number}
     */
    static getScientificNotation(value) {
        if (value !== undefined) {
            const roundedValue = Math.round(value * 100) / 100;
            if (roundedValue.toString().length < 8) {
                return roundedValue;
            }

            return value.toExponential(2);
        }
        return value;
    }

    /**
     * transforms a string to title case
     * @param {string} str
     * @return {string}
     */
    static toTitleCase(str) {
        return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).replace('_', ' ');
    }

    /**
     * checks if a value is or might become a number if more characters are added
     * @param {number} value
     * @returns {boolean}
     */
    static isValidValue(value) {
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
    static getTextWidth(text, fontSize) {
        const context = document.createElement('canvas').getContext('2d');
        context.font = `${fontSize}px Arial`;
        return context.measureText(text).width;
    }

    /**
     * crops the text to a certain width and adds "..." in the end
     * @param {string} text
     * @param {number} fontSize
     * @param {*} fontweight
     * @param {number} maxWidth
     * @returns {string}
     */
    static cropText(text, fontSize, fontweight, maxWidth) {
        let returnText = text;
        const context = document.createElement('canvas').getContext('2d');
        context.font = `${fontweight} ${fontSize}px Arial`;
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
}

export default UtilityFunctions;

export const num2letter = (num)=>{
    var mod = num % 26
    
    return String.fromCharCode(65 + mod)
}
