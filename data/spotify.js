const axios = require('axios');
const querystring = require('querystring');
const { get_from_items } = require('../src/utils/objects');

const MAX_QUERY_LENGTH = 50;

const std_get = async (access_token, url, params = {}) => {
    const response = await axios.get(url, {
        params,
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });

    return response.data;
};

async function get_auth(code, redirect_uri, auth_token) {
    const url = 'https://accounts.spotify.com/api/token';
    const body = querystring.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
    });

    const response = await axios.post(url, body, {
        headers: {
            Authorization: `Basic ${auth_token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });

    return response.data;
}

async function get_auth_from_refresh(refresh_token, auth_token) {
    const url = 'https://accounts.spotify.com/api/token';
    const body = querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    });

    const response = await axios.post(url, body, {
        headers: {
            Authorization: `Basic ${auth_token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });

    return response.data;
}

async function get_curr_user_profile(access_token) {
    const url = 'https://api.spotify.com/v1/me';
    const profile = await std_get(access_token, url);
    return profile;
}

async function get_curr_user_id(access_token) {
    const user_profile = await get_curr_user_profile(access_token);
    return user_profile.id;
}

async function get_all_top(access_token) {
    const types = ['artists', 'tracks'];
    const time_ranges = ['short_term', 'medium_term', 'long_term'];

    let top = {};

    for (const k of types) {
        top[k] = {};
        for (const r of time_ranges) {
            let top_data = await get_top(access_token, k, r, MAX_QUERY_LENGTH, 0);
            top[k][r] = get_from_items(top_data.items, 'id');
        }
    }

    top.date_updated = new Date();
    return top;
}

async function get_top(access_token, type, time_range, limit, offset) {
    const url = `https://api.spotify.com/v1/me/top/${type}`;

    let params = {
        time_range,
        limit,
        offset
    };

    const res = await std_get(access_token, url, params);

    return res;
}

async function get_one(access_token, type, id) {
    const url = `https://api.spotify.com/v1/${type}/${id}`;
    const res = await std_get(access_token, url);
    return res;
}

async function get_group(access_token, type, ids) {
    let group = [];

    const get_chunk = async (ids_chunk) => {
        const url = `https://api.spotify.com/v1/${type}`;
        const params = {
            ids: ids_chunk.join()
        };
        const res = await std_get(access_token, url, params);

        return res[type];
    }

    for (let i = 0; i < ids.length; i += MAX_QUERY_LENGTH) {
        const chunk = ids.slice(i, i + MAX_QUERY_LENGTH);
        const result = await get_chunk(chunk);
        group = group.concat(result);
    }

    return group;
}

async function get_album_tracks(access_token, id) {
    const url = `https://api.spotify.com/v1/albums/${id}/tracks`;
    const params = {
        limit: MAX_QUERY_LENGTH,
        offset: 0,
    };
    const tracks = await std_get(access_token, url, params);
    return tracks;
}

async function get_artist_tracks(access_token, id) {
    const url = `https://api.spotify.com/v1/artists/${id}/albums`;
    const params = {
        // include_groups: 'albums', 
        limit: MAX_QUERY_LENGTH,
        offset: 0,
    };
    const albums = await std_get(access_token, url, params);
    const ids = get_from_items(albums.items, 'id');
    // ?? Check if need to do chuncks
    // TODO: check for repeat songs
    let tracks = await Promise.all(ids.map(async (i) => {
        return await get_album_tracks(access_token, i);
    }));
    tracks = get_from_items(tracks, 'items').flat();
    
    return tracks;
}

async function get_top_genres(access_token, time_range, limit, offset) {
    const artists = await get_top(access_token, 'artists', time_range, limit, offset);
    const genres = get_from_items(artists.items, 'genres')
    console.log(genres);
}

module.exports = {
    MAX_QUERY_LENGTH,
    get_auth,
    get_auth_from_refresh,
    get_curr_user_profile,
    get_curr_user_id,
    get_all_top,
    get_top,
    get_one,
    get_group,
    get_album_tracks,
    get_artist_tracks,
    get_top_genres,
};
