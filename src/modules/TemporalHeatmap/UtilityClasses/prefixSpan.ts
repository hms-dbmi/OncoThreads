
export type TPattern = (number|string)[]
export type TPatternResults = Array<[number[], TPattern]>
type TMDB = Array<[number, number]>
type TOccur = any

class PrefixSpan{
    results: TPatternResults;
    db: Array<(string|number)[]>; 
    minSupport:number; 
    minLen:number;
    constructor(){
        this.results = []
        this.db = []
        this.minSupport = 0
        this.minLen = 0
    }
    recurrentFind(patt:TPattern, mdb:TMDB){

        if (patt.length>=this.minLen){
            this.results.push([mdb.map(d=>d[0]), patt])
        }

        let occurs:TOccur = {}
        for (let idx=0; idx<mdb.length;idx++){
            let [i, startpos] = mdb[idx]
            let seq = this.db[i]
            for (let j=startpos+1; j<seq.length; j++){
                let l = occurs[seq[j]]
                if (l==undefined ){
                    occurs[seq[j]] = [[i, j]]
                }else if (l[l.length-1][0]!= i){
                    occurs[seq[j]].push([i, j])
                }
            }
        }


       Object.keys(occurs).forEach(c=>{
           let newmdb = occurs[c]
           if (newmdb.length>=this.minSupport ){
               this.recurrentFind(patt.concat(c), newmdb)
           }
       })

    }
    frequentPatterns(db: Array<(string|number)[]>, minSupport?:number, minLen?:number){
        this.db = db
        this.minSupport = minSupport|| Math.ceil(db.length * 0.2) // if not given, defined based on db dimension
        this.minLen = minLen || Math.ceil(db[0].length * 0.2)
        let startMDB = [...Array(this.db.length).keys()].map(d=>[d, -1]) as TMDB

        this.recurrentFind([], startMDB)

        this.results
        .sort((a,b)=>-a.length+b.length)
        .sort((a,b)=>-a[1].length+b[1].length)

        return this.results
    }

} 


export default PrefixSpan