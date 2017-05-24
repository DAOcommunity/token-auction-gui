import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

const Tokens = new Mongo.Collection(null);

const tokens = {
  kovan: {
    'ETH': '0x53eccc9246c1e537d79199d0c7231e425a40f896',
    'DAI': '0x0000000000000000000000000000000000000000',
    'RAI': '0x383105dc3dab1646119335ae54afdfd9f2af4713', //TODO a substitute of DAI by @reverendus
    'MKR': '0x4bb514a7f83fbb13c2b41448208e89fabbcfe2fb',
  },
  live: {
    'ETH': '0xecf8f87f810ecf450940c9f60066b4a7a501d6a7',
    'DAI': '0x0000000000000000000000000000000000000000',
    'MKR': '0xc66ea802717bfb9833400264dd12c2bceaa34a6d',
  },
};

Tokens.getTokenAddress = function getTokenAddress(symbol) {
  const network = Session.get('network');
  return tokens[network][symbol];
};

Tokens.getTokenSymbol = function getTokenSymbol(address) {
  const network = Session.get('network');
  for (let symbol in tokens[network]) {
    if (tokens[network].hasOwnProperty(symbol) && (tokens[network][symbol] == address)) {
      return symbol;
    }
  }
  return null;
};

export default Tokens;
