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
            let roundedValue = Math.round(value * 100) / 100;
            if (roundedValue.toString().length < 8) {
                return roundedValue;
            }
            else {
                return value.toExponential(2);
            }
        }
        else return value;
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
        if (!isNaN(value) || value === "." || value === "-") {
            isValid = true;
        }
        else {
            const lowerCase = value.toLowerCase();
            if (lowerCase.endsWith("e+")) {
                let substring = lowerCase.substring(0, lowerCase.length - 2);
                isValid = !isNaN(parseFloat(substring)) && !substring.includes("e+")
            }
            else if (lowerCase.endsWith("e")) {
                let substring = lowerCase.substring(0, lowerCase.length - 1);
                isValid = !isNaN(parseFloat(substring)) && !substring.includes("e")
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
        const context = document.createElement("canvas").getContext("2d");
        context.font = fontSize + "px Arial";
        return context.measureText(text).width;
    }
}

export default UtilityFunctions;