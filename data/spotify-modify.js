const axios = require('axios');

const std_post = async (access_token, url, body) => {
    const response = await axios.post(url, body, {
        headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}

async function create_playlist(access_token, username, options) {
    let url = `https://api.spotify.com/v1/users/${username}/playlists`;
    let { uris, ...body } = options;
    let created = await std_post(access_token, url, body);
    
    if (uris) 
        return await playlist_add(access_token, created.id, { uris });
    
    return created;
}

async function playlist_add(access_token, id, options) {
    let url = `https://api.spotify.com/v1/playlists/${id}/tracks`;
    return await std_post(access_token, url, options);
}

module.exports = {
    create_playlist,
    playlist_add,
}
