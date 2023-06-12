const { generateRandomString } = require('./src/utils/strings');

const express = require('express');
const app = express();
const static = express.static(__dirname + '/public');
const configRoutes = require('./routes');
const exphbs = require('express-handlebars');
const session = require('express-session');

const hostname = 'localhost'
const port = 8000

app.use('/public', static);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    name: 'spotify_auth',
    secret: generateRandomString(36),
    resave: false,
    saveUninitialized: true
}));

app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

configRoutes(app);

app.listen(port, () => {
    console.log(`App running at http://${hostname}:${port}/`)
})
