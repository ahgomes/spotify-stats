const mongoCollections = require('../config/mongoCollections');
const users = mongoCollections.users;

const validate = require('./validate');
const spotify = require('./spotify');

async function create_user(id, access_token) {
    const username = validate.check_string_nonempty(id, 'username');

    const user_collection = await users();
    const existing_user = await user_collection.findOne({
        username: username,
    });

    if (existing_user != null)
        throw new Error('A user with that username already exists');

    let new_user = {
        username: username,
        top: await spotify.get_all_top(access_token),
    };

    const insert_user = await user_collection.insertOne(new_user);
    if (insert_user.insertedCount == 0)
        throw new Error('Could not create user');
    return { user_inserted: true };
}

async function get_user(id) {
    const username = validate.check_string_nonempty(id, 'username');

    const user_collection = await users();
    const user = await user_collection.findOne({
        username: username,
    });

    if (!user)
        throw new Error(`Could not find user with id '${username}'.`);
    return user;
}

async function update_top(id, access_token) {
    const username = validate.check_string_nonempty(id, 'username');

    const user_collection = await users();
    const user = await user_collection.findOne({
        username: username,
    });

    if (!user)
        throw new Error(`Could not find user with id '${username}'.`);

    let new_top = await spotify.get_all_top(access_token);

    const insert_user = await user_collection.updateOne(
        { username: username },
        { $set: { top: new_top }}
    );

    if (insert_user.modifiedCount == 0)
        throw new Error('Could not update top.');
    return { top_updated: true };
    
}

module.exports = {
    create_user,
    get_user,
    update_top,
}