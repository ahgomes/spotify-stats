/**
 * Uses a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

const { generateRandomString } = require('../src/utils/strings');
const charts = require('../src/utils/charts');
const objects = require('../src/utils/objects');
const { spotify_data, user_data } = require('../data');

const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const axios = require('axios');

require("dotenv").config();

const hostname = 'localhost'
const port = 8000

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = `http://${hostname}:${port}/callback`;
const auth_token = new Buffer.from(client_id + ':' + client_secret).toString('base64');

router.get('/', async (req, res) => {
    let access_token = req.session.access_token;
    if (!access_token) res.redirect('/login');
    else { 
        try {
            if (!req.session.user)
                req.session.user = await spotify_data.get_curr_user_id(access_token);
            let user_id = req.session.user;
            //await user_data.update_top(user_id, access_token);
            const artists = await spotify_data.get_top(access_token, 'artists', 'short_term', 10, 0);
            const tracks = await spotify_data.get_top(access_token, 'tracks', 'short_term', 10, 0);

            let { count, type, time_range } = req.query;
            let chart_max = (count != undefined && count != NaN) ? Number(count) : undefined;
            count = count || 10;
            type = type || 'artists';
            time_range = time_range || 'short_term';
            // TODO: validate query string
            res.render('index', { 
                title: 'Spotify Stats',
                username: user_id,
                artists: spotify_data.get_from_items(artists.items, 'name'),
                tracks: spotify_data.get_from_items(tracks.items, 'name'),
                form: { max: spotify_data.MAX_QUERY_LENGTH, count, type, time_range},
                chart: await charts.test(user_id, access_token, chart_max, type, time_range),
            });
        } catch (e) {
            res.send({ error: e });
        }
    }
});

router.get('/login', async (req, res) => {
    let state = generateRandomString(16);
    let scope = 'user-read-private user-read-email user-top-read';

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
    let { count, type, time_range } = req.body;
    // TODO: validate input
    res.redirect(`/?count=${count}&type=${type}&time_range=${time_range}`);
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
