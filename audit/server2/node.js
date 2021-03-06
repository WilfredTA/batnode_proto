const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kad = require('@kadenceproject/kadence');
const BatNode = require('../../batnode').BatNode;
const kad_bat = require('../../kadence_plugin').kad_bat;
const seed = require('../../constants').SEED_NODE
const fileUtils = require('../../utils/file').fileSystem;
const fs = require('fs');

// Create second batnode kadnode pair
const kadnode2 = new kad.KademliaNode({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./dbb'))),
  contact: { hostname: 'localhost', port: 9000 }
})

// Set up
kadnode2.plugin(kad_bat)
kadnode2.listen(9000)
const batnode2 = new BatNode(kadnode2)
kadnode2.batNode = batnode2

const nodeConnectionCallback = (serverConnection) => {
  serverConnection.on('end', () => {
    console.log('end')
  })
  serverConnection.on('data', (receivedData, error) => {
    if (error) { throw error; }
    receivedData = JSON.parse(receivedData)

    if (receivedData.messageType === "RETRIEVE_FILE") {
      batnode2.readFile(`./hosted/${receivedData.fileName}`, (err, data) => {
        if (err) { throw err; }
        serverConnection.write(data)
      })
    } else if (receivedData.messageType === "STORE_FILE") {
      let { fileName } = receivedData;

      batnode2.kadenceNode.iterativeStore(fileName, [batnode2.kadenceNode.identity.toString(), batnode2.kadenceNode.contact], (err, stored) => {
        let fileContent = new Buffer(receivedData.fileContent);

        batnode2.writeFile(`./hosted/${fileName}`, fileContent, (innerError) => {
          if (innerError) { throw innerError; }
          serverConnection.write(JSON.stringify({messageType: "SUCCESS"}))
        })
      });
    } else if (receivedData.messageType === "AUDIT_FILE") {
      fs.readFile(`./hosted/${receivedData.fileName}`, (innerErr, data) => {
        if (innerErr) { throw innerErr; }
        console.log('AUDIT_FILE - data: ', data);
        const shardSha1 = fileUtils.sha1HashData(data);
        console.log('shardSha1: ', shardSha1);
        serverConnection.write(shardSha1);
      });
    }
  })
}
batnode2.createServer(1900, '127.0.0.1', nodeConnectionCallback)


// Join:
kadnode2.join(seed)

console.log('BatNode address: ',kadnode2.batNode.address)
console.log('KadNode contact: ',kadnode2.contact)
