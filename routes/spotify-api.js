/**
 * Uses a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

const strings = require('../src/utils/strings');
const charts = require('../src/utils/charts');
const objects = require('../src/utils/objects');
const { spotify_data, spotify_mod, user_data } = require('../data');

const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const axios = require('axios');
const { access } = require('fs');

require("dotenv").config();

const hostname = 'localhost'
const port = 8000

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = `http://${hostname}:${port}/callback`;
const auth_token = new Buffer.from(client_id + ':' + client_secret).toString('base64');

const create_trackname = async (user, access_token) => {
    let past_tracks = objects.unique_values(user.past_tops.tracks.short_term);
    past_tracks = await spotify_data.get_group(access_token, 'tracks', Array.from(past_tracks));
    past_tracks = past_tracks.map(k => ({ name: k.name, uri: k.uri }));
    let dict = objects.sort_by_letter(new Set(past_tracks));
    const span = (str, found) => {
        return `<span${(!found) ? ` class="tl-letter"` : ''}>${str}</span>`;
    };
    return strings.string_to_tracklist(user.username, dict, span);
};

router.get('/', async (req, res) => {
    let access_token = req.session.access_token;
    if (!access_token) {
        res.redirect('/login');
        return;
    }
    
    try {
        if (!req.session.user)
            req.session.user = await spotify_data.get_curr_user_id(access_token);
        
        let username = req.session.user;
        let user = await user_data.get_user(username);

        let trackname = await create_trackname(user, access_token);

        let scores = objects.get_from_items(user.top.tracks.short_term, 'popularity')
        let popularity = scores.reduce((a, b) => a + b) / scores.length;
        
        /*--- BUILD CHART ---*/
        let options = { count: 10, type: 'artists', time_range: 'short_term' }
        let data = await user_data.compile_user_chart_data(user, access_token, options);
        let chart = charts.build_user_chart(data, options);
        
        /*--- RENDER HANDLEBARS ---*/
        res.render('index', {
            title: 'Spotify Stats',
            display_name: user.display_name,
            username,
            trackname: trackname.html.join(''),
            popularity,
            artists: objects.format_top(user.top, 'artists'),
            tracks: objects.format_top(user.top, 'tracks'),
            genres: objects.format_top(user.top, 'genres'),
            form: { max: spotify_data.MAX_QUERY_LENGTH, ...options },
            chart,
        });
    } catch (e) {
        res.send({ error: e });
    }
});

router.get('/login', async (req, res) => {
    let state = strings.gen_rand_str(16);
    let scope = 'user-top-read playlist-modify-public playlist-modify-private';

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

router.get('/callback', async (req, res) => {
    let code = req.query.code || null;
    let state = req.query.state || null;

    if (state === null) {
        res.send({ error: 'Missing state.' });
    } else {
        try {
            const body = await spotify_data.get_auth(code, redirect_uri, auth_token);
            req.session.access_token = body.access_token;
            req.session.refresh_token = body.refresh_token;
            res.redirect('/');
        } catch (e) {
            res.send({ error: e });
        }
    }
});

router.post('/refresh_chart', async (req, res) => {
    let access_token = req.session.access_token, 
        username = req.session.user;
    if (!access_token || !username) res.redirect('/login');

    let { count, type, time_range } = req.body;
    
    let error = false;

    // TODO: validation
    count = Number(count)

    if (error) {
        res.json({ error: { count, type, time_range } });
    }

    try {
        let options = { count, type, time_range }
        let user = await user_data.get_user(username);
        let data = await user_data.compile_user_chart_data(user, access_token, options);
        let chart = charts.build_user_chart(data, options);

        res.json({ chart });
    } catch(e) {
        res.json({ error: e });
    }
});

router.get('/save_playlist', async (req, res) => {
    let access_token = req.session.access_token,
        username = req.session.user;
    if (!access_token || !username) res.redirect('/login');
    
    let user = await user_data.get_user(username);
    let trackname = await create_trackname(user, access_token);

    try {
        await spotify_mod.create_playlist(access_token, username, {
            name: username,
            public: false,
            uris: trackname.uri
        });
        res.status(200).json({ saved: true });
    } catch (e) {
        let { status, message } = e.response.data.error
        res.status(status).json({ error: message });
    }
});

router.get('/update_top', async (req, res) => {
    let access_token = req.session.access_token;
    if (!access_token || !req.session.user) 
        res.json({ error: { logged_in: false }});
    else {
        let user = await spotify_data.get_curr_user_profile(access_token);
        try {
            await user_data.update_user_top(user, access_token);
        } catch (e) {
            res.json({ error: e });
        }
        
        res.json({ user_updated : true });
    }
});

router.get('/refresh_token', async (req, res) => {
    let refresh_token = req.query.refresh_token;
    try {
        const body = await spotify_data.get_auth_from_refresh(refresh_token, auth_token);
        let access_token = body.access_token;
        res.send({
            'access_token': access_token
        });
    } catch (e) {
        res.send({ error: e });
    }
});

module.exports = router;
