var port = 8001;
var dgram = require('dgram');
var express = require('express');
var io = require('socket.io');
var dns = require('dns');
var iconv = require('iconv-lite');

var app = express();
app.get('/', function(req, res){
  res.send('w');
});

app.get('/server/:ip/:port', function(req, res) {
    var client = dgram.createSocket("udp4");
    var message = new Buffer(4 + 4 + 2 + 1);

    dns.resolve4(req.params.ip, function(err, addresses)
    {
        if (err)
        {
            addresses = [req.params.ip];
        }

        console.log('got i for ' + addresses[0]);

        var addrBits = addresses[0].split('.');

        message.writeUInt32BE(0x53414d50, 0);
        message.writeUInt8(parseInt(addrBits[0]), 4);
        message.writeUInt8(parseInt(addrBits[1]), 5);
        message.writeUInt8(parseInt(addrBits[2]), 6);
        message.writeUInt8(parseInt(addrBits[3]), 7);

        message.writeUInt16LE(req.params.port, 8);

        message.writeUInt8(0x69, 10);

        client.on('message', function(msg) {
            var i = 11;
            var password = msg.readUInt8(i);
            i++;

            var players = msg.readUInt16LE(i);
            i += 2;

            var maxPlayers = msg.readUInt16LE(i);
            i += 2;

            var len = msg.readUInt32LE(i);
            i += 4;

            var hostname = iconv.decode(msg.slice(i, i + len), 'win1251');
            i += len;

            len = msg.readUInt32LE(i);
            i += 4;

            var gamemode = iconv.decode(msg.slice(i, i + len), 'win1251');
            i += len;

            len = msg.readUInt32LE(i);
            i += 4;

            var map = msg.toString(null, i, i + len);
            i += len;

            var info = {
                password: password,
                players: players,
                maxplayers: maxPlayers,
                hostname: hostname,
                gamemode: gamemode,
                map: map
            };

            var infoString = JSON.stringify(info);

            res.set('Content-Type', 'application/json');
            res.send(infoString);

            client.close();
        });

        client.send(message, 0, message.length, req.params.port, req.params.ip, function(err) {
        });
    });
});

app.get('/players/:ip/:port', function(req, res) {
    var client = dgram.createSocket("udp4");
    var message = new Buffer(4 + 4 + 2 + 1);

    dns.resolve4(req.params.ip, function(err, addresses)
    {
        if (err)
        {
            addresses = [req.params.ip];
        }

        console.log('got d for ' + addresses[0]);

        var addrBits = addresses[0].split('.');

        message.writeUInt32BE(0x53414d50, 0);
        message.writeUInt8(parseInt(addrBits[0]), 4);
        message.writeUInt8(parseInt(addrBits[1]), 5);
        message.writeUInt8(parseInt(addrBits[2]), 6);
        message.writeUInt8(parseInt(addrBits[3]), 7);

        message.writeUInt16LE(req.params.port, 8);

        message.writeUInt8(0x64, 10);

        client.on('message', function(msg) {
            var i = 11;
            var playerCount = msg.readUInt16LE(i);
            i += 2;

            var players = [];

            for (var d = 0; d < playerCount; d++)
            {
                var player = {};

                player.id = msg.readUInt8(i);
                i++;

                var len = msg.readUInt8(i);
                i++;

                player.nickname = msg.toString(null, i, i + len);
                i += len;

                player.score = msg.readUInt32LE(i);
                i += 4;

                player.ping = msg.readUInt32LE(i);
                i += 4;

                players.push(player);
            }

            var playersString = JSON.stringify(players);

            res.set('Content-Type', 'application/json');
            res.send(playersString);

            client.close();
        });

        client.send(message, 0, message.length, req.params.port, req.params.ip, function(err) {
        });
    });
});


app.get('/rules/:ip/:port', function(req, res) {
    var client = dgram.createSocket("udp4");
    var message = new Buffer(4 + 4 + 2 + 1);

    dns.resolve4(req.params.ip, function(err, addresses)
    {
        if (err)
        {
            addresses = [req.params.ip];
        }

        console.log('got r for ' + addresses[0]);

        var addrBits = addresses[0].split('.');

        message.writeUInt32BE(0x53414d50, 0);
        message.writeUInt8(parseInt(addrBits[0]), 4);
        message.writeUInt8(parseInt(addrBits[1]), 5);
        message.writeUInt8(parseInt(addrBits[2]), 6);
        message.writeUInt8(parseInt(addrBits[3]), 7);

        message.writeUInt16LE(req.params.port, 8);

        message.writeUInt8(0x72, 10);

        client.on('message', function(msg) {
            var i = 11;
            var ruleCount = msg.readUInt16LE(i);
            i += 2;

            var rules = {};

            for (var r = 0; r < ruleCount; r++) {
                var len = msg.readUInt8(i);
                i++;

                var key = msg.toString(null, i, i + len);
                i += len;

                len = msg.readUInt8(i);
                i++;

                var value = msg.toString(null, i, i + len);
                i += len;

                rules[key] = value;
            }

            var rulesString = JSON.stringify(rules);

            res.set('Content-Type', 'application/json');
            res.send(rulesString);

            client.close();
        });

        client.send(message, 0, message.length, req.params.port, req.params.ip, function(err) {
        });
    });
});

var nserver = require('http').createServer(app), io = io.listen(nserver, { log: false });

io.sockets.on('connection', function(socket)
{
    var conn = new ClientConnection(server.instance);

    conn.on('message', function(cn, message)
    {
        server.instance.handleMessage(cn, message);
    });

    conn.on('closed', function()
    {
        server.deleteConnection(conn);
    });

    conn.bindToWeb(socket);
});

nserver.listen(port);
console.log("server running on "+ port);