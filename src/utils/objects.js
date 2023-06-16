                                                
function entries_to_keys(obj, fill = -1, cap) { 
    let { metadata, ...rest } = obj;
    let entries = Object.entries(rest).sort().map(e => e[1]);
    cap = (cap > 0) ? Math.min(entries[0].length, cap) : entries[0].length; 
    let result = {};
    for (let i = 0; i < entries.length; i++) {
        for (let j = 0; j < cap; j++) {
            let id = entries[i][j];
            if (result[id] != null)
                result[id][i] = j;
            else {
                let t = Array(entries.length).fill(fill);
                t[i] = j;
                result[id] = t;
            }
        }
    }
    return result;
}

function unique_values(obj) { // metadata life cycle 
    let { metadata, ...rest } = obj; //twink death
    return new Set(Object.entries(rest).map(e => e[1]).flat()); //twink birth
}

// for insterting current top to past tops object in user data
function insert(from, to, opt = {metadata: {}, update: false}) {
    let date_str = from.date_updated.toISOString();
    let entries = Object.entries(from).slice(0, 2)
    entries.forEach(e => {
        let sub_e = Object.entries(e[1]);
        sub_e.forEach(se => {
            if (to[e[0]] == undefined) to[e[0]] = {};
            if (to[e[0]][se[0]] == undefined) to[e[0]][se[0]] = { metadata: opt.metadata };
            to[e[0]][se[0]][date_str] = se[1];
            if (opt.update) {
                to[e[0]][se[0]].metadata.max_index = unique_values(to[e[0]][se[0]]).size;
            }
        });

    });
    to.date_updated = from.date_updated;
    return to;
} 

function sort_by_letter(set) {
    let dict = {};
    set.forEach((e => {
        let l = e.at(0).toLowerCase();
        dict[l] = (dict[l] == undefined) ? [e] : dict[l].concat([e]);
    }))
    return dict;
}

module.exports = {
    entries_to_keys, 
    unique_values,
    insert,
    sort_by_letter,
};
