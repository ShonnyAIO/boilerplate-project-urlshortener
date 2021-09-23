require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongo = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mySecret = process.env['MONGO_URI'];
const bodyParser = require('body-parser');

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

const URL = mongoose.model("URLS", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input;
  URL.findOne({ short_url: input }, (error, result) => {
    if (!error && result != "undefined") {
      res.redirect(result.original_url);
    } else {
      res.json('URL not found');
    }
  })
});

let responseObject = {};
app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (req, res) => {
  const urlRegex = new RegExp(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi);
  const url = req.body.url;

  if (!url.match(urlRegex)) {
    res.json({ error: 'invalid url' });
  }

  responseObject['original_url'] = url;
  let shortUrl = 1;


  URL.findOne({}).sort({ short_url: 'desc' }).exec((error, response) => {
    if (!error && response != undefined) {
      shortUrl = response.short_url + 1;
    }
    if (!error) {
      URL.findOneAndUpdate({ original_url: url }, { original_url: url, short_url: shortUrl }, { new: true, upsert: true }, (err, result) => {
        if (!err) {
          responseObject['short_url'] = result.short_url;
          res.json(responseObject);
        }
      })
    }
    if (error) {
      return res.json({ error: error });
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
