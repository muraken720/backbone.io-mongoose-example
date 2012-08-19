Backbone.IO's MongooseStore Example using mubsub.
=================================

Setup
-----
You need to install MongoDB first. 

    npm install

    npm start

Usage
-----

On the server: (Original -> https://github.com/scttnlsn/backbone.io/blob/master/examples/basic.js)

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



On the client: (Original -> https://github.com/scttnlsn/backbone.io/blob/master/examples/index.html)

	var Message = Backbone.Model.extend({

	  idAttribute: "_id",

	  initialize: function() {
	    this.on('error', function(model, res) {
	    　　alert(res.error.message);
	    });
	  }

	});


Server side model update using mubsub.
--------------------------------------

On the server: 

	var mubsub = require('mubsub');
	var client = mubsub('mongodb://localhost:27017/backboneio');
	var channel = client.channel('mubsub');

	channel.subscribe({ type: 'create' }, function(doc) {
	    console.log(doc.type);
	    Model.create(doc.model, function(err) {
		    if(err) {
			    console.log(err.message);
			    return;
			  }
		    console.log(doc.model);
		    messages.emit('created', doc.model);
		  });
	});

	channel.subscribe({ type: 'delete' }, function(doc) {
	    console.log(doc.type);
	    Model.remove( {_id: doc.model._id}, function(err) {
		    if(err) {
			    console.log(err.message);
			    return;
			  }
		    console.log(doc.model);
		    messages.emit('deleted', doc.model);
		  });
	});

	channel.subscribe({ type: 'update' }, function(doc) {
	    console.log(doc.type);
			var model = {};
			for (var key in doc.model) {
			  model[key] = doc.model[key];
			}
			delete model._id;
			Model.update( { _id: doc.model._id }, { '$set': model }, function(err) {
		    if(err) {
			    console.log(err.message);
			    return;
			  }
		    console.log(doc.model);
		    messages.emit('updated', doc.model);
		  });
	});


Test using MongoDB shell:

	> use backboneio
	switched to db backboneio
	
	> show collections
	models
	mubsub
	system.indexes
	
	> db.mubsub.insert( {type: "create", model: {text: "test message!"}} )

