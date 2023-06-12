/**
 * Uses a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

const { generateRandomString } = require('../src/utils/strings');
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
            const user_id = await spotify_data.get_curr_user_id(access_token);
            // console.log(user_id);
            // const tracks = await spotify_data.get_top_tracks(access_token, 'short_term', 50, 0);
            // let track_names = tracks.items.map(x => x.name);
            // res.render('partials/top-list', { title: 'Top Tracks', names: track_names });
            //user_data.create_user(user_id);
            const top_update = await user_data.update_top(user_id, access_token);
            const user = await user_data.get_user(user_id);
            res.json(user);
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
        res.send({ error: e });
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