
class MDL {
    clusters: string[][][]    
    constructor(sequences: string[][]){
        this.clusters=sequences.map(d=>[d])
    }
    dist(c1: string[][], c2:string[][]):number{
        return 0
    }
}

export default MDL