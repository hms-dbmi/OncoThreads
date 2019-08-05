import { action, extendObservable } from 'mobx';

/*
 Store containing all the other stores gets the data with either the cBioAPI
 or from local files, transforms it and gives it to the other stores
 */
class ScoreStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.scoreStructure = {};
        this.TimeLineVariability = {};

        extendObservable(this, {
            // calculateVScore: action(() => {
            calculateVScore() {
                const SM = this.rootStore.staticMappers;

                const ST = this.rootStore.sampleStructure;

                const numOfPatients = Object.keys(ST).length;

                const timeLineLength = this.rootStore.timepointStructure.length;

                const self = this;


                const dTypeRet = function (q) {
                    return self.rootStore.clinicalSampleCategories
                        .filter(d => d.id === q)[0].datatype;
                };

                // let scoreStructure = {};
                let m = 0;
                for (let i = 1; i < Object.keys(SM).length; i++) {
                    const iK = Object.keys(SM)[i];


                    const iV = Object.values(SM)[i];

                    // var dType = self.rootStore.clinicalSampleCategories.filter(function(d){ if(d.id===iK) return d})[0].datatype;

                    const dType = dTypeRet(iK);

                    if (dType === 'STRING') {
                        var all_vals = Object.values(iV);
                        var unique_vals = [...new Set(all_vals)];

                        const total_val = unique_vals.length;

                        // console.log("num of values: " + total_val);

                        // console.log("for " +iK +": score = ");

                        for (var j = 0; j < Object.keys(ST).length; j++) {
                            // console.log(Object.keys(ST)[j]);

                            for (var k = 0; k < Object.values(ST)[j].length - 1; k++) {
                                // console.log(Object.values(ST)[j][k]);
                                if (iV[Object.values(ST)[j][k]] !== iV[Object.values(ST)[j][k + 1]]) {
                                    // console.log(Object.values(ST)[j][k]);
                                    // console.log(iV[Object.values(ST)[j][k]]);
                                    // console.log(iV[Object.values(ST)[j][k+1]]);
                                    m++;
                                } else if (iK === 'Timepoint') {
                                    // console.log(iV[Object.values(ST)[j][k]]);
                                    // console.log(iV[Object.values(ST)[j][k+1]]);
                                }
                            }
                        }

                        m /= total_val;

                        m /= timeLineLength;

                        m = this.getNumWithSetDec(m / numOfPatients, 2);
                    } else if (dType === 'NUMBER') {
                        all_vals = Object.values(iV);
                        unique_vals = [...new Set(all_vals)];

                        // var total_val=unique_vals.length;

                        const range_val = Math.max(...all_vals) - Math.min(...all_vals) + 1;

                        // console.log("range: " + range_val);


                        // console.log("for " +iK +": score = ");

                        for (j = 0; j < Object.keys(ST).length; j++) {
                            // console.log(Object.keys(ST)[j]);

                            for (k = 0; k < Object.values(ST)[j].length - 1; k++) {
                                // console.log(Object.values(ST)[j][k]);
                                if (iV[Object.values(ST)[j][k]] !== iV[Object.values(ST)[j][k + 1]]) {
                                    m += Math.abs(iV[Object.values(ST)[j][k]] - iV[Object.values(ST)[j][k + 1]]);
                                }
                            }
                        }

                        m /= range_val;

                        m /= timeLineLength;

                        m = this.getNumWithSetDec(m / numOfPatients, 2);
                    }

                    // console.log(m);

                    this.scoreStructure[iK] = m;


                    m = 0;
                }

                // console.log(this.scoreStructure);

                // }),
            },


            getNumWithSetDec: action((num, numOfDec) => {
                const pow10s = Math.pow(10, numOfDec || 0);
                return (numOfDec) ? Math.round(pow10s * num) / pow10s : num;
            }),

            getAverageFromNumArr: action((numArr, numOfDec) => {
                // if( !isArray( numArr ) ){ return false;	}
                let i = numArr.length;


                let sum = 0;
                while (i--) {
                    sum += numArr[i];
                }
                return this.getNumWithSetDec((sum / numArr.length), numOfDec);
            }),

            getVariance: action((numArr, numOfDec) => {
                // if( !isArray(numArr) ){ return false; }
                const avg = this.getAverageFromNumArr(numArr, numOfDec);


                let i = numArr.length;


                let v = 0;

                // console.log("avg= "+avg);


                while (i--) {
                    v += Math.pow((numArr[i] - avg), 2);
                }

                // console.log(v);

                v /= numArr.length;

                // console.log(v);

                return this.getNumWithSetDec(v, numOfDec);
            }),


            getCoefficientOfVariation: action((numArr, numOfDec) => {
                const avg = this.getAverageFromNumArr(numArr, numOfDec);
                const standard_dev = Math.sqrt(this.getVariance(numArr, numOfDec));
                return this.getNumWithSetDec((standard_dev / avg), numOfDec);
            }),

            calculateVScoreWithinTimeLine: action(() => {
                const SM = this.rootStore.staticMappers;

                const ST = this.rootStore.sampleStructure;

                const self = this;


                Object.keys(SM).forEach((iK, i) => {
                    if (!i) {
                        return;
                    }
                    const iV = SM[iK];

                    this.TimeLineVariability[iK] = {};


                    const dType = self.rootStore.clinicalSampleCategories.filter(d => d.id === iK)[0].datatype;

                    if (dType === 'STRING') {
                        // coefficient of unalikeability DO NOT REMOVE

                        /* var samples=Object.values(ST);

                         var sample_length=samples.map(function(d){return d.length});


                         var max_sample=Math.max(...sample_length);

                         [...Array(max_sample).keys()].forEach(a => {

                         //for(var a=0; a<max_sample; a++){

                         //var r=[];

                         //samples.forEach(function(d){if(d[a]) r.push(d[a])});
                         var r = samples.filter(d=> d[a]).map((d)=>d[a]);


                         //var set1 = new Set();

                         var temp=[];
                         for(var j=0; j<r.length; j++){
                         //set1.add(iV[r[j]]);
                         temp.push(iV[r[j]]);
                         }

                         //console.log(temp);

                         var uniq=[...new Set(temp)];

                         var u_vals=[];

                         for(var x=0; x<uniq.length; x++){
                         let q=uniq[x];

                         let t_num=temp.filter(d=>d===q).length;

                         u_vals.push(t_num);


                         }

                         //console.log(u_vals);

                         //u_vals contains number of variables in each category. Now calculate the variability

                         //var m=0;

                         var t_v=0;

                         //console.log(iK);
                         //console.log("\n n is " + temp.length);

                         //else{
                         for(x=0; x<u_vals.length; x++){
                         t_v=t_v + (u_vals[x]*(temp.length-u_vals[x]))/(temp.length * temp.length);
                         }
                         //}


                         //this.TimeLineVariability[iK][a]=set1.size; ///r.length;

                         t_v= this.getNumWithSetDec(t_v,2);

                         this.TimeLineVariability[iK][a]= t_v;

                         }); */


                        // ModVR: https://en.wikipedia.org/wiki/Qualitative_variation


                        var samples = Object.values(ST);

                        var sample_length = samples.map(d => d.length);


                        var max_sample = Math.max(...sample_length);

                        [...Array(max_sample).keys()].forEach((a) => {
                            // for(var a=0; a<max_sample; a++){

                            // var r=[];

                            // samples.forEach(function(d){if(d[a]) r.push(d[a])});
                            const r = samples.filter(d => d[a]).map(d => d[a]);


                            // var set1 = new Set();

                            const temp = [];
                            for (let j = 0; j < r.length; j++) {
                                // set1.add(iV[r[j]]);

                                if (iV[r[j]]) {
                                    temp.push(iV[r[j]]);
                                }

                                // temp.push(iV[r[j]]);
                            }

                            // console.log(temp);

                            const uniq = [...new Set(temp)]; // unique categories

                            const u_vals = [];

                            for (let x = 0; x < uniq.length; x++) {
                                const q = uniq[x];

                                const t_num = temp.filter(d => d === q).length;

                                u_vals.push(t_num);
                            }


                            const K = u_vals.length; // NumOfCategories

                            const Fm = Math.max(...u_vals); // ModalFrequency

                            const TotalElements = temp.length;

                            // var t_v= K*Fm - TotalElements;

                            let t_v = 0;

                            if (K - 1 > 0) {
                                t_v = (TotalElements * K - K * Fm) / (TotalElements * (K - 1));
                            }

                            t_v = this.getNumWithSetDec(t_v, 2);

                            this.TimeLineVariability[iK][a] = t_v;
                        });
                    }
                    // standard deviation //DO NOT DELETE THIS YET
                    else if (dType === 'NUMBER') {
                        samples = Object.values(ST);

                        sample_length = samples.map(d => d.length);


                        max_sample = Math.max(...sample_length);

                        for (let a = 0; a < max_sample; a++) {
                            const r = [];

                            // samples.map(function(d){if(d[a]) r.push(d[a])});
                            // samples.filter(d=> {if(d[a]) r.push(d[a])});

                            for (let p = 0; p < samples.length; p++) {
                                if (samples[p][a]) {
                                    r.push(samples[p][a]);
                                }
                            }


                            // var set1 = new Set();

                            const temp = [];
                            for (let j = 0; j < r.length; j++) {
                                // set1.add(iV[r[j]]);
                                if (iV[r[j]]) {
                                    temp.push(iV[r[j]]);
                                }
                            }

                            // console.log(temp);


                            // this.TimeLineVariability[iK][a]=set1.size; ///r.length;

                            // get variance

                            // var t_v=this.getVariance( temp, 2 ); //variance;

                            // get standard deviation

                            // t_v=this.getNumWithSetDec(Math.sqrt(this.getVariance( temp, 4 )), 2);

                            // get coefficient of variation

                            let t_v = 0;

                            if (temp.length > 0) {
                                t_v = this.getCoefficientOfVariation(temp, 2);
                            }

                            this.TimeLineVariability[iK][a] = t_v;
                        }
                    }

                    // console.log(m);

                    // this.TimeLineVariability[iK][a]= t_v;


                    // m=0;
                });


                console.log('Scores within timeline: ');
                console.log(this.TimeLineVariability);
            }),


            /* calculateVScoreWithinTimeLineOld: action(() => {


             var SM= this.rootStore.staticMappers;

             var ST=this.rootStore.sampleStructure;

             let self=this;


             Object.keys(SM).forEach((iK,i) => {
             if(!i) {
             return;
             }
             var iV= SM[iK];

             this.TimeLineVariability[iK]={};


             var dType = self.rootStore.clinicalSampleCategories.filter((d) => d.id===iK)[0].datatype;

             if(dType==="STRING"){

             var samples=Object.values(ST);

             var sample_length=samples.map(function(d){return d.length});


             var max_sample=Math.max(...sample_length);

             [...Array(max_sample).keys()].forEach(a => {

             //for(var a=0; a<max_sample; a++){

             //var r=[];

             //samples.forEach(function(d){if(d[a]) r.push(d[a])});
             var r = samples.filter(d=> d[a]).map((d)=>d[a]);


             //var set1 = new Set();

             var temp=[];
             for(var j=0; j<r.length; j++){
             //set1.add(iV[r[j]]);
             temp.push(iV[r[j]]);
             }

             //console.log(temp);

             var uniq=[...new Set(temp)];

             var u_vals=[];

             for(var x=0; x<uniq.length; x++){
             let q=uniq[x];

             let t_num=temp.filter(d=>d===q).length;

             u_vals.push(t_num);


             }

             //console.log(u_vals);

             //u_vals contains number of variables in each category. Now calculate the variability

             //var m=0;

             var t_v=0;

             //console.log(iK);
             //console.log("\n n is " + temp.length);


             for(x=0; x<u_vals.length; x++){
             t_v=t_v + (u_vals[x]*(temp.length-u_vals[x]))/(temp.length * temp.length);
             }


             //this.TimeLineVariability[iK][a]=set1.size; ///r.length;

             t_v= this.getNumWithSetDec(t_v,2);

             this.TimeLineVariability[iK][a]= t_v;

             });


             }
             //standard deviation //DO NOT DELETE THIS YET
             else if(dType==="NUMBER"){

             samples=Object.values(ST);

             sample_length=samples.map(function(d){return d.length});


             max_sample=Math.max(...sample_length);

             for(var a=0; a<max_sample; a++){

             var r=[];

             //samples.map(function(d){if(d[a]) r.push(d[a])});
             //samples.filter(d=> {if(d[a]) r.push(d[a])});

             for(let p=0; p<samples.length; p++){
             if(samples[p][a]){
             r.push(samples[p][a]);
             }
             }


             //var set1 = new Set();

             var temp=[];
             for(var j=0; j<r.length; j++){
             //set1.add(iV[r[j]]);
             temp.push(iV[r[j]]);
             }

             //console.log(temp);


             //this.TimeLineVariability[iK][a]=set1.size; ///r.length;

             var t_v=this.getVariance( temp, 2 ); //variance;

             //get standard deviation

             //t_v=this.getNumWithSetDec(Math.sqrt(this.getVariance( temp, 4 )), 2);
             this.TimeLineVariability[iK][a]= t_v;

             }


             }

             //console.log(m);

             //this.TimeLineVariability[iK][a]= t_v;


             // m=0;
             });


             //console.log(this.TimeLineVariability);

             }), */

        });
    }

    getVarianceTimeLine(dtype, input) {
        const TimeLineVariance = [];

        const ST = this.rootStore.sampleStructure;

        const samples = Object.values(ST);

        const sample_length = samples.map(d => d.length);


        const max_sample = Math.max(...sample_length);

        for (let a = 0; a < max_sample; a++) {
            const r = [];

            // samples.map(function(d){if(d[a]) r.push(d[a])});
            // samples.filter(d=> {if(d[a]) r.push(d[a])});

            for (let p = 0; p < samples.length; p++) {
                if (samples[p][a]) {
                    r.push(samples[p][a]);
                }
            }


            // var set1 = new Set();

            const temp = [];
            for (let j = 0; j < r.length; j++) {
                // set1.add(iV[r[j]]);
                if (input[r[j]]) {
                    temp.push(input[r[j]]);
                }
            }

            // console.log(temp);


            // this.TimeLineVariability[iK][a]=set1.size; ///r.length;

            // get variance

            // var t_v=this.getVariance( temp, 2 ); //variance;

            // get standard deviation

            // t_v=this.getNumWithSetDec(Math.sqrt(this.getVariance( temp, 4 )), 2);

            // get coefficient of variation

            const vr = this.getVariance(temp, 2); // variance;


            TimeLineVariance.push(vr);
        }

        return TimeLineVariance;
    }

    getCoeffientOfVarTimeLine(dtype, input) {
        const TimeLineCoV = [];

        const ST = this.rootStore.sampleStructure;

        const samples = Object.values(ST);

        const sample_length = samples.map(d => d.length);


        const max_sample = Math.max(...sample_length);

        for (let a = 0; a < max_sample; a++) {
            const r = [];

            // samples.map(function(d){if(d[a]) r.push(d[a])});
            // samples.filter(d=> {if(d[a]) r.push(d[a])});

            for (let p = 0; p < samples.length; p++) {
                if (samples[p][a]) {
                    r.push(samples[p][a]);
                }
            }


            // var set1 = new Set();

            const temp = [];
            for (let j = 0; j < r.length; j++) {
                // set1.add(iV[r[j]]);
                if (input[r[j]]) {
                    temp.push(input[r[j]]);
                }
            }

            // console.log(temp);


            // this.TimeLineVariability[iK][a]=set1.size; ///r.length;

            // get variance

            // var t_v=this.getVariance( temp, 2 ); //variance;

            // get standard deviation

            // t_v=this.getNumWithSetDec(Math.sqrt(this.getVariance( temp, 4 )), 2);

            // get coefficient of variation


            let t_v = 0;

            if (temp.length > 0) {
                t_v = this.getCoefficientOfVariation(temp, 2);
            }

            // this.TimeLineVariability[iK][a]= t_v;


            TimeLineCoV.push(t_v);
        }

        return TimeLineCoV;
    }

    /*
     * calculate score for variability
     */
    getModVRAcross(dtype, input) { // input is the same as iV in calculateVScore()
        const ST = this.rootStore.sampleStructure;

        let m = 0;


        const all_patients_vals = Object.values(ST);

        const total_patients = all_patients_vals.length;

        // var all_scores=0;

        let t_v = 0;

        // var index=[];

        let maxIndices = [];
        let temp_var_arr = [];
        let max_temp_var = Number.NEGATIVE_INFINITY;// -100;
        all_patients_vals.forEach((d, i) => {
            const temp = [];
            for (let j = 0; j < d.length; j++) {
                // set1.add(iV[r[j]]);

                if (input[d[j]]) {
                    temp.push(input[d[j]]);
                }

                // temp.push(iV[r[j]]);
            }

            // console.log(temp);

            const uniq = [...new Set(temp)]; // unique categories

            const u_vals = [];

            for (let x = 0; x < uniq.length; x++) {
                const q = uniq[x];

                const t_num = temp.filter(d => d === q).length;

                u_vals.push(t_num);
            }


            const K = u_vals.length; // NumOfCategories

            const Fm = Math.max(...u_vals); // ModalFrequency

            const TotalElements = temp.length;

            // var t_v= K*Fm - TotalElements;

            // var t_v=0;


            if (K - 1 > 0) {
                const temp_var2 = (TotalElements * K - K * Fm) / (TotalElements * (K - 1));
                if (temp_var2 > max_temp_var) {
                    max_temp_var = temp_var2;
                    // index=i;
                }

                temp_var_arr.push(temp_var2);
                t_v += temp_var2;
            } else {
                temp_var_arr.push(Number.NEGATIVE_INFINITY);
            }

            // t_v= this.getNumWithSetDec(t_v,2);
        });

        for (var q = 0; q < temp_var_arr.length; q++) {
            if (temp_var_arr[q] === max_temp_var) {
                maxIndices.push(q);
            }
        }

        const patients = Object.keys(ST);

        // console.log("For "+ iK + " the following patients have max variance");

        // this.str_patient_variability= this.str_patient_variability +  "For "+ iK + " the following patients have max variance";
        let str_1 = '';
        for (q = 0; q < maxIndices.length; q++) {
            str_1 = `${str_1} ${patients[maxIndices[q]]}`;
        }
        // console.log(str_1);

        // this.str_patient_variability =  this.str_patient_variability + str_1 ;


        maxIndices = [];
        temp_var_arr = [];
        max_temp_var = Number.NEGATIVE_INFINITY;// -100;

        m = this.getNumWithSetDec(t_v / total_patients, 2);


        return m;
    }


    gerModVRWithin(dtype, input) {
        // var SM= this.rootStore.staticMappers;

        const TimeLineModVR = [];

        const ST = this.rootStore.sampleStructure;

        // let self=this;


        // Object.keys(SM).forEach((iK,i) => {

        // if(!i) {
        //      return;
        // }
        const iV = input; // SM[iK];

        // this.TimeLineVariability[iK]={};

        // this.TimeLineVariability;

        // var dType = self.rootStore.clinicalSampleCategories.filter((d) => d.id===iK)[0].datatype;


        // ModVR: https://en.wikipedia.org/wiki/Qualitative_variation


        const samples = Object.values(ST);

        const sample_length = samples.map(d => d.length);


        const max_sample = Math.max(...sample_length);

        [...Array(max_sample).keys()].forEach((a) => {
            // for(var a=0; a<max_sample; a++){

            // var r=[];

            // samples.forEach(function(d){if(d[a]) r.push(d[a])});
            const r = samples.filter(d => d[a]).map(d => d[a]);


            // var set1 = new Set();

            const temp = [];
            for (let j = 0; j < r.length; j++) {
                // set1.add(iV[r[j]]);

                if (iV[r[j]]) {
                    temp.push(iV[r[j]]);
                }

                // temp.push(iV[r[j]]);
            }

            // console.log(temp);

            const uniq = [...new Set(temp)]; // unique categories

            const u_vals = [];

            for (let x = 0; x < uniq.length; x++) {
                const q = uniq[x];

                const t_num = temp.filter(d => d === q).length;

                u_vals.push(t_num);
            }


            const K = u_vals.length; // NumOfCategories

            const Fm = Math.max(...u_vals); // ModalFrequency

            const TotalElements = temp.length;

            // var t_v= K*Fm - TotalElements;

            let t_v = 0;

            if (K - 1 > 0) {
                t_v = (TotalElements * K - K * Fm) / (TotalElements * (K - 1));
            }

            t_v = this.getNumWithSetDec(t_v, 2);

            // this.TimeLineVariability[a]= t_v;

            TimeLineModVR.push(t_v);
        });


        // console.log(m);

        // this.TimeLineVariability[iK][a]= t_v;


        // m=0;
        // });


        // console.log("Scores within timeline: ");
        // console.log(this.TimeLineModVR);


        return TimeLineModVR;
    } // end of TimeLineModVR

    /**
     * computes the change rate for a mapper
     * @param {Object} mapper - mapping of sampleId to values
     * @param {string} datatype - type of variable
     * @return {number} change rate
     */
    getChangeRate(mapper, datatype) {
        // for non-numerical variables compute #changes/#transitions
        if (datatype !== 'NUMBER') {
            let allTransitions = 0;
            let changes = 0;
            Object.keys(this.rootStore.sampleStructure).forEach((patient) => {
                this.rootStore.sampleStructure[patient].map(sample => mapper[sample])
                    .filter(value => value !== undefined)
                    .forEach((value, i, array) => {
                        if (i !== array.length - 1) {
                            allTransitions += 1;
                            if (value !== array[i + 1]) {
                                changes += 1;
                            }
                        }
                    });
            });
            return changes / allTransitions;
            // for numerical variables compute averageChange/observedRange
        }
        let sumOfChange = 0;
        let allTransitions = 0;
        let minChange = Number.POSITIVE_INFINITY;
        let maxChange = Number.NEGATIVE_INFINITY;
        Object.keys(this.rootStore.sampleStructure).forEach((patient) => {
            this.rootStore.sampleStructure[patient].map(sample => mapper[sample])
                .filter(value => value !== undefined)
                .forEach((value, i, array) => {
                    if (i !== array.length - 1) {
                        if (value !== undefined
                            && array[i + 1] !== undefined) {
                            allTransitions += 1;
                            const change = Math.abs(value
                                - array[i + 1]);
                            sumOfChange += change;
                            minChange = Math.min(minChange, change);
                            maxChange = Math.max(maxChange, change);
                        }
                    }
                });
        });
        if (minChange === maxChange || minChange === Number.POSITIVE_INFINITY
            || maxChange === Number.NEGATIVE_INFINITY) {
            return 0;
        }
        return (sumOfChange / allTransitions) / (maxChange - minChange);
    }
}

export default ScoreStore;
