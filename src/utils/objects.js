
function entries_to_keys(obj, fill = -1) {
    let entries = Object.entries(obj).sort().map(e => e[1]);
    let result = {};
    for (let i = 0; i < entries.length; i++) {
        for (let j = 0; j < entries[0].length; j++) {
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

// gets entries within a certain rank/index
function within_index(obj, start, end) {
    const btwn = (arr) => {
        return arr.some(x => x >= start && x < end);
    };
    return filter(obj, btwn);
}

// from 
// https://stackoverflow.com/questions/5072136/javascript-filter-for-objects
function filter(obj, predicate) {
    return Object.assign(...Object.keys(obj)
            .filter(key => predicate(obj[key]))
            .map(key => ({ [key]: obj[key] })));
}

// for insterting current top to past tops object in user data
function insert(from, to) {
    let date_str = from.date_updated.toISOString();
    let entries = Object.entries(from).slice(0, 2)
    entries.forEach(e => {
        let sub_e = Object.entries(e[1]);
        sub_e.forEach(se => {
            if (to[e[0]] == undefined) to[e[0]] = {};
            if (to[e[0]][se[0]] == undefined) to[e[0]][se[0]] = {};
            to[e[0]][se[0]][date_str] = se[1];
        });

    });
    to.date_updated = from.date_updated;
    return to;
} 

module.exports = {
    entries_to_keys,
    within_index,
    filter, 
    insert,
};
