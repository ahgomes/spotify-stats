
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

module.exports = {
    entries_to_keys,
};