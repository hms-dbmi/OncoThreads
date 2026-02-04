
export type TPattern = (number | string)[]
export type TPatternResults = Array<[number[], TPattern]>
type TMDB = Array<[number, number]> //Array<[sequenceIdx, startIdx in this sequence]>
type TOccur = any

class PrefixSpan {
    results: TPatternResults;
    db: Array<(string | number)[]>;
    minSupport: number;
    minLen: number;
    maxLen: number;
    constructor() {
        this.results = []
        this.db = []
        this.minSupport = 0
        this.minLen = 0
        this.maxLen = Infinity
    }
    recurrentFind(patt: TPattern, mdb: TMDB) {

        if (patt.length >= this.minLen && patt.length <= this.maxLen) {
            this.results.push([mdb.map(d => d[0]), patt])
        }
        if (patt.length > this.maxLen) return

        const occurs: TOccur = {}
        for (let idx = 0; idx < mdb.length; idx++) {
            const [seqIdx, pos] = mdb[idx]
            const seq = this.db[seqIdx]
            for (let newPos = pos + 1; newPos < seq.length; newPos++) {
                const l = occurs[seq[newPos]]
                if (l === undefined) {
                    occurs[seq[newPos]] = [[seqIdx, newPos]]
                } else if (l[l.length - 1][0] !== seqIdx) {
                    occurs[seq[newPos]].push([seqIdx, newPos])
                }
            }
        }


        Object.keys(occurs).forEach(item => {
            const newmdb = occurs[item]
            if (newmdb.length >= this.minSupport) {
                this.recurrentFind(patt.concat(item), newmdb)
            }
        })

    }
    frequentPatterns(db: Array<(string | number)[]>, minSupport?: number, minLen?: number, maxLen?: number) {
        this.db = db
        this.minSupport = minSupport || Math.ceil(db.length * 0.2) // if not given, defined based on db dimension
        this.minLen = minLen || Math.ceil(db[0].length * 0.2)
        this.maxLen = maxLen || Infinity
        const startMDB = [...Array(this.db.length).keys()].map(d => [d, -1]) as TMDB

        this.recurrentFind([], startMDB)

        this.results
            .sort((a, b) => -a.length + b.length)
            .sort((a, b) => -a[1].length + b[1].length)

        return this.results
    }

}


export default PrefixSpan