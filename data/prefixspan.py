#%%
from collections import defaultdict



#%%



def prefixSpan(db, minsup=2, minlen = 2):

    results = []
    def frequent_rec(patt, mdb):
        results.append((len(mdb), patt))

        occurs = defaultdict(list)
        for (i, startpos) in mdb:
            seq = db[i]
            for j in range(startpos + 1, len(seq)):
                l = occurs[seq[j]]
                if len(l) == 0 or l[-1][0] != i:
                    l.append((i, j))

        for (c, newmdb) in occurs.items():
            if len(newmdb) >= minsup:
                frequent_rec(patt + [c], newmdb)

    frequent_rec([], [(i, -1) for i in range(len(db))])

    print([result for result in results if len(result[1])>=minlen])
# %%
db = [
    [0, 1, 2, 3, 4],
    [1, 1, 1, 3, 4],
    [2, 1, 2, 2, 0],
    [1, 1, 1, 2, 2],
]

prefixSpan(db)
# %%
