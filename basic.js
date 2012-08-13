var express = require('express');
var mongoose = require('mongoose');
var backboneio = require('backbone.io');

var app = express();
app.use(express.static(__dirname));

var http = require('http');
var server = http.createServer(app);
server.listen(3000);

console.log('http://localhost:3000/');

var db = mongoose.createConnection('mongodb://localhost/backboneio');
var Schema = new mongoose.Schema({
  text: String
});
var Model = db.model('Model', Schema);

var messages = backboneio.createBackend();
messages.use(function(req, res, next) {
  console.log(req.backend);
  console.log(req.method);
  console.log(JSON.stringify(req.model));
  next();
});
messages.use(backboneio.middleware.mongooseStore(Model));

backboneio.listen(server, { messages: messages });
