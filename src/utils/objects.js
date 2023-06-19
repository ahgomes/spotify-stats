                                                
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
    let {date_updated , ...rest} = from;
    let date_str = date_updated.toISOString();
    let entries = Object.entries(rest);
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

function get_from_items(items, selection) {
    if (typeof selection == 'string') {
        let keys = selection.split('.');
        if (keys.length == 1)
            return items.map(i => i[selection]);

        let res = get_from_items(items, keys.shift());
        return get_from_items(res, keys.join('.'));
    }

    let collection = {};
    selection.forEach((s => {
        let key = s.split('.').join('_');
        collection[key] = get_from_items(items, s);
    }));

    return collection;
};

function rank_genres(genres) {
    let o = {};
    genres.forEach((gg, i) => {
        gg.forEach(g => {
            if (o[g] == undefined) o[g] = [0, 0, 0];
            o[g][0] += i;
            o[g][1]++;
            o[g][2] = o[g][0] / o[g][1];
        })
    });
    let ranked = Object.entries(o).sort((a, b) => {
        return (b[1][1] - a[1][1] == 0) ? (a[1][2] - b[1][2]) : (b[1][1] - a[1][1]);
    }).map(e => e[0]);
    return ranked;
}

module.exports = {
    entries_to_keys, 
    unique_values,
    insert,
    sort_by_letter,
    get_from_items,
    rank_genres,
};
