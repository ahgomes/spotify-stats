const axios = require('axios');
const { log } = require('console');
const querystring = require('querystring');

const get_from_items = (items, selection) => items.map(i => i[selection]);

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
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });

    return response.data;
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
            let top_data = await get_top(access_token, k, r, 50, 0);
            top[k][r] = get_from_items(top_data.items, 'id');
        }
    }

    top.date = new Date();
    return top;
}

async function get_top(access_token, type, time_range, limit, offset) {
    const url = `https://api.spotify.com/v1/me/top/${type}`;
    const response = await axios.get(url, {
        params: {
            time_range: time_range,
            limit: limit,
            offset: offset
        },
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });

    return response.data;
}

async function get_top_tracks(access_token, time_range, limit, offset) {
    const url = 'https://api.spotify.com/v1/me/top/tracks';
    const response = await axios.get(url, {
        params: {
            time_range: time_range,
            limit: limit,
            offset: offset
        },
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });

    return response.data;
}

module.exports = {
    get_auth,
    get_auth_from_refresh,
    get_curr_user_profile,
    get_curr_user_id,
    get_all_top,
    get_top_tracks,
};