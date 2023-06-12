const mongoCollections = require('../config/mongoCollections');
const users = mongoCollections.users;

const validate = require('./validate');

async function create_user(id) {
    const username = validate.check_string_nonempty(id, 'username');

    const user_collection = await users();
    const existing_user = await user_collection.findOne({
        username: username,
    });

    if (existing_user != null)
        throw new Error('A user with that username already exists');

    let new_user = {
        username: username,
        top: {
            date: new Date(),
            artists: {
                short_term: [],
                medium_term: [],
                long_term: [],
            },
            tracks: {
                short_term: [],
                medium_term: [],
                long_term: [],
            },
        }
    };

    const insertUser = await user_collection.insertOne(new_user);
    if (insertUser.insertedCount == 0)
        throw new Error('Could not create user');
    return { userInserted: true };
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

module.exports = {
    create_user,
    get_user,
}