const mongoCollections = require('../config/mongoCollections');
const users = mongoCollections.users;

const { check_string_nonempty } = require('../src/utils/strings');
const objects = require('../src/utils/objects');
const spotify = require('./spotify');

const user_set = async (id) => {
    const username = check_string_nonempty(id, 'username');

    const user_collection = await users();
    const user = await user_collection.findOne({
        username,
    });

    return { username, user, user_collection };
};

async function create_user(spotify_user, access_token) {
    let { id, display_name } = spotify_user;
    const { username, user, user_collection } = await user_set(id);

    if (user != null)
        throw new Error('A user with that username already exists');

    let curr_top = await spotify.get_all_top(access_token);
    let top_ids = await spotify.get_all_top_ids(access_token, Object.assign({}, curr_top));
    let new_user = {
        username,
        display_name,
        top: curr_top,
        past_tops: objects.insert(top_ids, {}, { metadata: { max_index: spotify.MAX_QUERY_LENGTH } }),
    };

    const insert_user = await user_collection.insertOne(new_user);
    if (insert_user.insertedCount == 0)
        throw new Error('Could not create user');
    return { user_inserted: true };
}

async function get_user(id) {
    const { username, user } = await user_set(id);

    if (!user)
        throw new Error(`Could not find user with id '${username}'.`);

    return user;
}

async function update_user_top(spotify_user, access_token) {
    let { id, display_name } = spotify_user;
    const { username, user, user_collection } = await user_set(id);

    if (!user)
        throw new Error(`Could not find user with id '${username}'.`);

    let new_top = await spotify.get_all_top(access_token);
    let new_top_ids = await spotify.get_all_top_ids(access_token, Object.assign({}, new_top))
    let new_pt = objects.insert(new_top_ids, user.past_tops, { update: true });

    const insert_user = await user_collection.updateOne(
        { username },
        { $set: { display_name, top: new_top, past_tops: new_pt }}
    );

    if (insert_user.modifiedCount == 0)
        throw new Error('Could not update top.');
    return { top_updated: true };
}

async function remove_user(id) {
    const { username, user, user_collection } = await user_set(id);

    if (!user)
        throw new Error(`Could not find user with id '${username}'.`);

    const deleted_user = await user_collection.deleteOne( { username });

    if (deleted_user.deleteCount == 0) 
        throw new Error('Could not delete user.');
    return { user_removed: true };
};

async function compile_user_chart_data(user, access_token, options) {
    let { count, type, time_range } = options;
    let pos = objects.entries_to_keys(user['past_tops'][type][time_range], count, count);
    let keys = Object.keys(pos), values = Object.values(pos);
    
    if (type != 'genres') {
        let d = await spotify.get_group(access_token, type, keys);
        keys = d.map(k => k.id + '%' + k.name);
    }

    return Object.fromEntries(keys.map((_, i) => [keys[i], values[i]]))
}

module.exports = {
    create_user,
    get_user,
    update_user_top,
    remove_user,
    compile_user_chart_data,
}
