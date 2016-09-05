import { Mongo } from 'meteor/mongo';
import Tokens from './tokens.js';
import Transactions from './transactions.js';

const Auctionlets = new Mongo.Collection(null);
const BID_GAS = 1000000;
const CLAIM_GAS = 1000000;

Auctionlets.findAuctionlet = function findAuctionlet() {
  return Auctionlets.findOne({ auctionletId: Session.get('currentAuctionletId') });
};

Auctionlets.loadAuctionlet = function loadAuctionlet(currentAuctionletId) {
  TokenAuction.objects.auction.getAuctionletInfo(currentAuctionletId, (error, result) => {
    if (!error) {
      Auctionlets.remove({});
      const auctionlet = {
        auctionletId: currentAuctionletId,
        auction_id: result[0].toString(10),
        last_bidder: result[1],
        last_bid_time: new Date(result[2].toNumber() * 1000),
        buy_amount: result[3].toString(10),
        sell_amount: result[4].toString(10),
        unclaimed: result[5],
        base: result[6],
        isExpired: false,
      };
      Auctionlets.insert(auctionlet);
      Auctionlets.syncExpired();
    } else {
      console.log('auctionlet info error: ', error);
    }
  });
};

// Check whether an auctionlet is expired and if so update the auctionlet
Auctionlets.syncExpired = function syncExpired() {
  const currentAuctionletId = Session.get('currentAuctionletId');
  TokenAuction.objects.auction.isExpired(currentAuctionletId, (error, result) => {
    if (!error) {
      if (result) {
        Auctionlets.update({ auctionletId: currentAuctionletId }, { $set: { isExpired: result } });
      }
    } else {
      console.log('syncExpired error', error);
    }
  });
};

Auctionlets.calculateRequiredBid = function calculateRequiredBid(buyAmount, minIncrease) {
  const requiredBid = web3.toBigNumber(buyAmount).mul(100 + minIncrease).div(100);
  return requiredBid;
};

Auctionlets.doBid = function doBid(bidAmount) {
  console.log('doBid function called');
  Tokens.setEthAllowance(bidAmount);
};

Auctionlets.bidOnAuctionlet = function bidOnAuctionlet(auctionletId, bidAmount, quantity) {
  TokenAuction.objects.auction.bid['uint256,uint256,uint256'](auctionletId, bidAmount, quantity,
  { gas: BID_GAS }, (error, result) => {
    if (!error) {
      console.log(result);
      Transactions.add('bid', result, { auctionletId, bid: bidAmount.toString(10) });
    } else {
      console.log('error: ', error);
    }
  });
};

Auctionlets.watchBid = function watchBid() {
  /* eslint-disable new-cap */
  TokenAuction.objects.auction.Bid((error) => {
    if (!error) {
      console.log('Bid is set');
      const currentAuctionletId = Session.get('currentAuctionletId');
      Auctionlets.loadAuctionlet(currentAuctionletId);
    } else {
      console.log('error: ', error);
    }
  });
  /* eslint-enable new-cap */
};

Auctionlets.watchBidTransactions = function watchBidTransactions() {
  Transactions.observeRemoved('bid', (document) => {
    if (document.receipt.logs.length === 0) {
      Session.set('bidMessage', { message: 'Error placing bid', type: 'alert-danger' });
    } else {
      console.log('bid', document.object.bid);
      Session.set('bidMessage', { message: 'Bid placed succesfully', type: 'alert-success' });
    }
  });
};

Auctionlets.doClaim = function doClaim(auctionletId) {
  TokenAuction.objects.auction.claim(auctionletId, { gas: CLAIM_GAS }, (error, result) => {
    if (!error) {
      Transactions.add('claim', result, { auctionletId });
      Session.set('claimMessage', { message: 'Claiming your tokens', type: 'alert-info' });
    } else {
      console.log('Claim error: ', error);
      Session.set('claimMessage', { message: `Error claiming tokens: ${error.toString()}`, type: 'alert-danger' });
    }
  });
};

Auctionlets.watchClaimTransactions = function watchClaimTransactions() {
  Transactions.observeRemoved('claim', (document) => {
    if (document.receipt.logs.length === 0) {
      console.log('Claim went wrong');
      Session.set('claimMessage', { message: 'Error claiming tokens', type: 'alert-danger' });
    } else {
      console.log('Claim is succesful');
      Session.set('claimMessage', { message: 'Tokens successfully claimed', type: 'alert-success' });
      const currentAuctionletId = Session.get('currentAuctionletId');
      Auctionlets.loadAuctionlet(currentAuctionletId);
    }
  });
};

export default Auctionlets;
