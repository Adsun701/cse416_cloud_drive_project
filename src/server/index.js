const express = require('express');
const dotenv = require('dotenv')
const os = require('os');

dotenv.config()
const app = express();

app.use(express.static('dist'));
app.get('/api/getUsername', (req, res) => res.send({ username: os.userInfo().username }));

const db = require('./db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once("open", () => {console.log("MongoDB connected successfully")})

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
