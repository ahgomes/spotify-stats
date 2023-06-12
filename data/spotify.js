const axios = require('axios');
const { log } = require('console');
const querystring = require('querystring');


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
    get_curr_user_profile,
    get_curr_user_id,
    get_top_tracks,
};