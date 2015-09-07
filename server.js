/**
 * Module dependencies
 */

var fs = require('fs');
var join = require('path').join;
var express = require('express');
var mongoose = require('mongoose');
var WebSocketServer = require('ws').Server;

var config = require('./config/config');

var app = express();
var port = process.env.PORT || 3000;
var wsPort = 4000;

// Connect to mongodb
var connect = function () {
  var options = {server: {socketOptions: {keepAlive: 1}}};
  mongoose.connect(config.db, options);
};
connect();

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

// Bootstrap models
fs.readdirSync(join(__dirname, 'app/models')).forEach(function (file) {
  if (~file.indexOf('.js')) require(join(__dirname, 'app/models', file));
});

// Bootstrap application settings
require('./config/express')(app);

// Bootstrap routes
require('./config/routes')(app);

app.listen(port);
console.log('Express app started on port ' + port);

var wss = new WebSocketServer({port: wsPort});
wss.on('connection', function (ws) {
  ws.on('message', function (message) {
    ws.send(message);
  });
});
console.log('WebSocket server started on port ' + wsPort);

/**
 * Expose
 */

module.exports = app;
