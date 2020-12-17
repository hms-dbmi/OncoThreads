type TCounts = {
    [key:string]:{
        ngram:string[],
        // counts?: number[], // counts at each sequence
        seqCounts: number[],
        totalCount:number, // 
    }
}

class NGram{
    arrs:string[][]
    ns:number[] // the n in n-gram
    minSupport:number
    debug:boolean=false 
    results: {ngram:string[], totalCount: number}[] = []
    arrEncodings: number[][] = []
    constructor(arrs:string[][], ns:number[], minSupport:number, debug:boolean=false ){
        this.arrs = arrs
        this.ns = ns
        this.minSupport = minSupport
        this.debug = debug||this.debug

        this.ns.forEach(n=>this.count_arrays(n))
    }
    count_arrays = ( n:number) => {
        let arrs = this.arrs, minSupport = this.minSupport, debug = this.debug

        const counts:TCounts = {};
        if (debug) console.log("arr:", arrs);
        arrs.forEach((arr,arrIdx)=>{
            for (let i = n; i <= arr.length; i++) {
                const ngram = arr.slice(i - n, i);
                if (debug) console.log("ngram:", ngram);
                let gramKey = ngram.join()
                if (counts.hasOwnProperty(gramKey)) {
                    counts[gramKey].totalCount++;
                    counts[gramKey]['seqCounts'][arrIdx] += 1
                } else {
                    let seqCounts = arrs.map(_=>0)
                    seqCounts[arrIdx] = 1
                    counts[gramKey] = { ngram, totalCount: 1, seqCounts};
                }
            }
        })
       
        if (debug) console.log("counts:", counts);
        let results = Object.values(counts)
            .filter(d=>d.totalCount>=minSupport)
            .sort((a, b) => Math.sign(b.totalCount - a.totalCount))


        if (debug) console.log("results:", results);

        if (this.arrEncodings.length==0){
            this.arrEncodings = arrs.map((_,i)=>{
                return results.map(r=>r.seqCounts[i])
            })
    
        }else{
            this.arrEncodings = this.arrEncodings.map((encoding,i)=>{
                return encoding.concat( results.map(r=>r.seqCounts[i]) )
            })
        }
    
        


        this.results = this.results.concat(results)
       
    }

    getNGram(){
        return this.results
    }

    getArrEncodings(){
        return this.arrEncodings
    }
}

// const count_arrays = ( arrs:string[][], n:number, minSupport:number, debug:boolean ) => {
//     const counts:TCounts = {};
//     if (debug) console.log("arr:", arrs);
//     arrs.forEach((arr,arrIdx)=>{
//         for (let i = n; i <= arr.length; i++) {
//             const ngram = arr.slice(i - n, i);
//             if (debug) console.log("ngram:", ngram);
//             let gramKey = ngram.join()
//             if (counts.hasOwnProperty(gramKey)) {
//                 counts[gramKey].totalCount++;
//                 counts[gramKey]['seqCounts'][arrIdx] += 1
//             } else {
//                 let seqCounts = arrs.map(_=>0)
//                 seqCounts[arrIdx] = 1
//                 counts[gramKey] = { original: ngram, totalCount: 1, seqCounts};
//             }
//         }
//     })
   
//     if (debug) console.log("counts:", counts);
//     let results = Object.values(counts)
//         .filter(d=>d.totalCount>=minSupport)
//         .sort((a, b) => Math.sign(b.totalCount - a.totalCount))

//     let sequenceEncoding = arrs.map((_,i)=>{
//         return results.map(r=>r.seqCounts[i])
//     })
   
//     if (debug) console.log("results:", results);
//     return results.map(d=>[d.original, d.totalCount]);
// }


// const n_gram=(data:string[][], ns:number[], minSupport:number, debug:boolean=false ) => {
    
//     let results:(number|string[])[][] = []
//     ns.forEach(n=>{
//         let grams = count_arrays( data, n, minSupport, debug );
//         results.concat(grams)
//     })
//     return results

// };

export default NGram