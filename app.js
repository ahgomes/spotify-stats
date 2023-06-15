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
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 },
}));

const hbs = exphbs.create({
    helpers: {
        // from
        // https://stackoverflow.com/a/16928455
        select(selected, options) {
            return options.fn(this).replace(
                new RegExp(` value="${selected}"`),
                '$& selected="selected"');
        }
    },
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

configRoutes(app);

app.listen(port, () => {
    console.log(`App running at http://${hostname}:${port}/`)
})
