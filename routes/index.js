const spotify_routes = require('./spotify-api');

const constructorMethod = (app) => {
    app.use('/', spotify_routes)
    app.use('*', (req, res) => {
        res.status(404).json({ error: 'Not found' });
    });
};

module.exports = constructorMethod;
