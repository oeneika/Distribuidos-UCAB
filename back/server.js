require("./config/config");

const rp = require("request-promise");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const _ = require("lodash");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const port = process.env.PORT;

var nextplayer = process.env.NEXT;
var app = express();

app.use(
  cors({
    origin: true,
    exposedHeaders: "x-access-token"
  })
);

app.use(bodyParser.json());

//endpoints
app.post("/add", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["input1", "input2"]);
  body.total = parseInt(body.input1) + parseInt(body.input2);
  res.json(body);
});

app.post("/sub", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["input1", "input2"]);
  body.total = parseInt(body.input1) - parseInt(body.input2);
  res.json(body);
});

// not match endpoints
app.get("/*", (req, res) => {
  res.status(404).send();
});

app.post("/*", (req, res) => {
  res.status(404).send();
});

app.put("/*", (req, res) => {
  res.status(404).send();
});

app.delete("/*", (req, res) => {
  res.status(404).send();
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});
