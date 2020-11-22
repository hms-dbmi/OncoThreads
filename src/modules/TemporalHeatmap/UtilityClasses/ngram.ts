type TCounts = {
    [key:string]:{
        original:string[],
        // counts?: number[], // counts at each sequence
        seqCounts: number[],
        totalCount:number, // 
    }
}

const count_arrays = ( arrs:string[][], n:number, minSupport:number, debug:boolean ) => {
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
                counts[gramKey] = { original: ngram, totalCount: 1, seqCounts};
            }
        }
    })
   
    if (debug) console.log("counts:", counts);
    let results = Object.values(counts)
        .filter(d=>d.totalCount>=minSupport)
        .sort((a, b) => Math.sign(b.totalCount - a.totalCount))
        .map(d=>[d.original, d.totalCount])
   
    if (debug) console.log("results:", results);
    return results;
}


const n_gram=(data:string[][], ns:number[], minSupport:number, debug:boolean=false ) => {
    
    let results:(number|string[])[][] = []
    ns.forEach(n=>{
        let grams = count_arrays( data, n, minSupport, debug );
        results.concat(grams)
    })
    return results

};

export default n_gram