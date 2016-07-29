import { Auctions } from '../../api/auctions.js';
import { Auctionlets } from '../../api/auctionlets.js';
import { Tokens } from '../../api/tokens.js';
import { Tracker } from 'meteor/tracker';
import { Transactions } from '../../lib/_transactions.js';

TokenAuction.init('morden')

Meteor.startup(function() {
  
  web3.eth.filter('latest', function () {
    Tokens.sync()
    Transactions.sync()
  })

  web3.eth.isSyncing(function (error, sync) {
    if (!error) {
      Session.set('syncing', sync !== false)

      // Stop all app activity
      if (sync === true) {
        // We use `true`, so it stops all filters, but not the web3.eth.syncing polling
        web3.reset(true)
        checkNetwork()
      // show sync info
      } else if (sync) {
        Session.set('startingBlock', sync.startingBlock)
        Session.set('currentBlock', sync.currentBlock)
        Session.set('highestBlock', sync.highestBlock)
      } else {
        Session.set('outOfSync', false)
        //Offers.sync()
        web3.eth.filter('latest', function () {
          Tokens.sync()
          Transactions.sync()
        })
      }
    }
  })

  //Meteor.setInterval(checkNetwork, 2503)
  //Meteor.setInterval(web3.checkAccounts, 10657)
})

Tracker.autorun(function() {
  web3.checkAccounts();
  Auctions.getAuction();
  Auctionlets.getAuctionlet();
  Tokens.sync()
})

// CHECK FOR NETWORK
function checkNetwork () {
  web3.version.getNode(function (error, node) {
    var isConnected = !error

    // Check if we are synced
    if (isConnected) {
      web3.eth.getBlock('latest', function (e, res) {
        Session.set('outOfSync', e != null || new Date().getTime() / 1000 - res.timestamp > 600)
      })
    }

    // Check which network are we connected to
    // https://github.com/ethereum/meteor-dapp-wallet/blob/90ad8148d042ef7c28610115e97acfa6449442e3/app/client/lib/ethereum/walletInterface.js#L32-L46
    if (!Session.equals('isConnected', isConnected)) {
      if (isConnected === true) {
        web3.eth.getBlock(0, function (e, res) {
          var network = false
          if (!e) {
            switch (res.hash) {
              case '0x49a392153fb11a3446cd6953333f24a2e295312f':
                network = 'test'
                break
              case '0x49a392153fb11a3446cd6953333f24a2e295312f':
                network = 'main'
                break
              default:
                network = 'private'
            }
          }
        })
      } else {
        Session.set('isConnected', isConnected)
        Session.set('network', false)
      }
    }
  })
}