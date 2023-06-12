const check_string_nonempty = (string, name) => {
    if (string == undefined || typeof string != 'string')
        throw 'Error: No string provided'
        + ((name) ? ` for "${name}".` : '.');

    let str = string.trim();
    if (str.length < 1)
        throw 'Error: Provided string'
        + ((name) ? ` for "${name}" is empty.` : ' is empty.');

    return str;
};

module.exports = {
    check_string_nonempty,
}