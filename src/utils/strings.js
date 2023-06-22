
function gen_rand_str(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

function check_string_nonempty(string, name) {
    if (string == undefined || typeof string != 'string')
        throw 'Error: No string provided'
        + ((name) ? ` for "${name}".` : '.');

    let str = string.trim();
    if (str.length < 1)
        throw 'Error: Provided string'
        + ((name) ? ` for "${name}" is empty.` : ' is empty.');

    return str;
};

function string_to_tracklist(str, dict, format = (str, found) => str) {
    return str.split('').reduce((a, c) => {
        if (dict[c] == undefined) return format(c, false);
        let t = dict[c].shift();
        dict[c].push(t);
        t.html = format(t.name, true);
        Object.entries(t).forEach(e => a[e[0]].push(e[1]));
        return a;
    }, {name: [], uri: [], html: []});
};


module.exports = {
    gen_rand_str,
    check_string_nonempty,
    string_to_tracklist,
}
