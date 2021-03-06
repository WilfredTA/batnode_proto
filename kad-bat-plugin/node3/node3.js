const bunyan = require('bunyan');
const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kad = require('@kadenceproject/kadence');
const BatNode = require('../../batnode.js').BatNode;
const kad_bat = require('../kadence_plugin').kad_bat;
const seed = require('../../constants').SEED_NODE;
const publicIp = require('public-ip');
const stellar_account = require('../kadence_plugin').stellar_account;

// Create a third batnode kadnode pair


kadnode3 = new kad.KademliaNode({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./dbbb'))),
  contact: {hostname: '127.0.0.1', port: 1252}
})

// Set up
kadnode3.plugin(kad_bat)
kadnode3.listen(1252)
kadnode3.plugin(stellar_account);
const batnode3 = new BatNode(kadnode3)
kadnode3.batNode = batnode3
batnode3.createServer(1985, '127.0.0.1')

// Join


kadnode3.join(seed, () => {
  console.log('you have joined the network! Ready to accept commands from the CLI!')
  // batnode3.uploadFile('./personal/example.txt')
  //batnode3.retrieveFile('./manifest/a8fe349f81906570773853d82b52a8b6bedf2a36.batchain')
})
