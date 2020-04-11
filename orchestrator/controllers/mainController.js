var amqp = require('amqplib/callback_api');
const path = require('path')
const fs = require('fs')

const request = require('request-promise')


rabbit = {
	hostname:"amqp://localhost/",
	virtualHost: "rideshare",
	user: "ravi",
	password: "ravi"
}
const rabbitServer = rabbit.hostname+rabbit.virtualHost
const opt = { 
	credentials: require('amqplib').credentials.plain(rabbit.user,rabbit.password)
}


exports.home = (req, res, next) => {
	res.send("Hello Team 2020!")
}

exports.writeDb = (req, res, next) => {
	console.log("DB Write");
	if (req.method === "POST" || req.method === "DELETE") {
		req.queue = "write"
		sendData(req, (err,retval)=>{
			if (err) {
				return res.status(500).send(err)
			}
			res.status(200).send()
			channel.assertExchange(exchange, 'fanout', {
				durable: false
			  });
			  channel.publish(exchange, '', Buffer.from(msg));
			  console.log(" [x] Sent %s", msg);
		});
	} else {
		res.status(400).send("Method Not Supported")
	}
}


exports.readDb = (req) => {
	console.log("DB Write");
	if (req.method === "POST") {
		req.queue = "read"
		sendData(req, (err,retval)=>{
			if (err) {
				return res.status(500).send(err)
			}
			req.queue = "response"
			readData(req, (err,retval)=>{
				if (err) {
					return res.status(500).send(err)
				}
				res.status(200).send(retval)
			});
		
		});
	} else {
		res.status(400).send("Method Not Supported")
	}
}

exports.clearDb = (req, res, next) => {
	console.log("Clear DB");
	if (req.method === "POST") {
		
		var tables = ["rides","users"]
		tables.forEach(table => {
			let db_req = { "table": table, where: {}};
			const options = {
				method: "DELETE",
				body: db_req,
				json: true
			}
			req.body = options
			req.queue = "write"
			sendData(req, (err,retval)=>{
				if (err) {
					return res.status(500).send(err)
				}
				res.status(200).send(retval)
			});
		});
	} else {
		res.status(400).send("Method Not Supported")
	}
}

//--------------------------------------------

function callback(err, data) {
	if(err) {
	  console.log(err);
	  return;
	}
	console.log(data);
}

sendData = (req)=>{
	amqp.connect( rabbitServer, opt,function(error0, connection) {
  		if (error0) {
			console.error(error0) 
			return callback(error)
  		}
		connection.createChannel(function(error1, channel) {
			if(error1){
				console.error(error0) 
				return callback(error)
			}
			//var queue = 'write';
			queue = req.queue			
			channel.assertQueue(queue, {
				durable: false
			});
		  channel.sendToQueue(queue, Buffer.from(JSON.stringify(req)));
		  return callback(null,{})
		});
    	setTimeout(function() {
			connection.close();
			process.exit(0);
			},
			500
		);
	});
}

readData = (req)=>{
	amqp.connect( rabbitServer, opt,function(error0, connection) {
  		if (error0) {
			console.error(error0) 
			return callback(error)
  		}
		connection.createChannel(function(error1, channel) {
			if(error1){
				console.error(error0) 
				return callback(error)
			}
			//var queue = 'write';
			queue = req.queue			
			channel.assertQueue(queue, {
				durable: false
			});
			channel.consume(queue, (msg) => {
				data = msg.content.toString()
				console.log(" Received %s", data );
				return callback(null,JSON.parse(data))
			}, {
				noAck: true
			});
		});
    	setTimeout(function() {
			connection.close();
			process.exit(0);
			},
			500
		);
	});
}