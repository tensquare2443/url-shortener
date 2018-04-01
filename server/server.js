const path = require("path");
const url = require("url");
const http = require("http");

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");

var app = express();
var port = process.env.PORT || 3000;

var authToken;
if (process.env.API_KEY) {
  authToken = process.env.API_KEY;
} else {
  var keySheet = require("../bitlyauth");
  authToken = keySheet.authToken;
}

app.use(express.static(path.join(__dirname, "../public")));
app.use(bodyParser.json());

var checkUrl = (path, query) => {
  var urlPath = path.replace("/", "");
  return new Promise((resolve, reject) => {
    if (urlPath === "shorten" || urlPath === "shorten/") {
      if (Object.keys(query).length === 1 && query.url) {
        resolve();
      } else reject();
    } else reject();
  });
}

app.get("/*", (req, res) => {

  checkUrl(req.path, req.query).then(() => {
    var longUrl = req.query.url;
    var longUrlEncoded = encodeURIComponent(longUrl);
    var apiUrl = `https://api-ssl.bitly.com/v3/shorten?access_token=${authToken}&longUrl=${longUrlEncoded}&domain=j.mp`;

    request({url: apiUrl, json: true}, (error, response, body) => {
      if (error) {res.send({error: "Server could not be reached"});}

      if (body.status_txt === "OK") {
        var shortUrl = body.data.url;
        res.send({longUrl, shortUrl});
      } else if (body.status_txt === "INVALID_URI") {
        res.send({
          longUrl,
          shortUrl: "Long URL is invalid."
        });
      }
    });
  }).catch(() => {
    res.redirect("/");
  });

});

app.listen(port, () => {
  console.log(`Server is live. Port: ${port}`);
});
