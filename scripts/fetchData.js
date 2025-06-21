require('dotenv').config();
const Web3 = require('web3');
const web3 = new Web3(process.env.RPC_URL);
const Restaker = require('../models/restaker'); 
const Validator = require('../models/validator'); 
const Reward = require('../models/reward'); 

const CONTRACT_ADDRESS = '0xAcc1fb458a1317E886dB376Fc8141540537E68fE';

const EVENT_SIGNATURE = 'RewardsDistributed(address,address,uint256,uint256)';
const EVENT_TOPIC = web3.utils.keccak256(EVENT_SIGNATURE);
const STETH_STRATEGY = '0xacb55c530acdb2849e6d4f36992cd8c9d50ed8f7';
const API_KEY = process.env.EIGEN_API_KEY;
const MAX_RECORDS = 2000;
const BATCH_SIZE = 100; 
const BLOCK_RANGE = 10000; 
const RETRY_DELAY = 1000; 
const MAX_RETRIES = 3;

async function fetchData() {
  let skip = 0;
  const PAGE_SIZE = 100;
  let synced = 0;

  try {
    const initialRes = await fetch(`https://api.eigenexplorer.com/stakers?skip=0&take=1`, {
      headers: { 'X-API-Token': API_KEY }
    });
    const initialJson = await initialRes.json();
    const totalAvailable = initialJson?.meta?.total || 0;

    const recordsToFetch = Math.min(MAX_RECORDS, totalAvailable);
    const maxPages = Math.ceil(recordsToFetch / PAGE_SIZE);

    for (let page = 0; page < maxPages; page++) {
      const url = `https://api.eigenexplorer.com/stakers?skip=${skip}&take=${PAGE_SIZE}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-API-Token': API_KEY }
      });

      const json = await response.json();
      const stakers = json?.data || [];
      if (stakers.length === 0) break;

      for (const staker of stakers) {
        if (synced >= MAX_RECORDS) break;

        const { address, operatorAddress, updatedAt, shares } = staker;
        if (!address || !operatorAddress || !shares?.length) continue;

        const stethShare = shares.find(
          s => s.strategyAddress.toLowerCase() === STETH_STRATEGY
        );
        if (!stethShare || stethShare.shares === '0') continue;

        const doc = {
          userAddress: address.toLowerCase(),
          targetAVSOperatorAddress: operatorAddress.toLowerCase(),
          amountRestakedStETH: parseFloat(stethShare.shares) / 1e18,
          lastUpdated: new Date(updatedAt).toISOString(), 
        };

        await Restaker.updateOne(
          { userAddress: doc.userAddress },
          { $set: doc },
          { upsert: true }
        );

        synced++;
      }
      skip += PAGE_SIZE;
    }

  } catch (err) {
    console.error('Sync error:', err);
  }
}


// async function syncValidators() {
//   let skip = 0;
//   let synced = 0;
//   const PAGE_SIZE = 100;
//   try {
//     while (true) {
//       if (synced >= MAX_RECORDS) break;

//       const url = `https://api.eigenexplorer.com/operators?skip=${skip}&take=${PAGE_SIZE}`;
//       const res = await fetch(url, {
//         method: 'GET',
//         headers: { 'X-API-Token': API_KEY }
//       });

//       const json = await res.json();
//       const operators = json?.data || [];
//       if (operators.length === 0) break;

//       for (const op of operators) {
//         const { address, updatedAt, shares } = op;

//         const stethShare = shares.find(s => s.strategyAddress.toLowerCase() === STETH_STRATEGY);
//         if (!stethShare || stethShare.shares === '0') continue;

//         const doc = {
//           operatorAddress: address.toLowerCase(),
//           totalDelegatedStakeStETH: parseFloat(stethShare.shares) / 1e18,
//           status: 'active',
//           lastUpdated: Math.floor(new Date(updatedAt).getTime() / 1000),
//           slashHistory: []
//         };

//         await Validator.updateOne(
//           { operatorAddress: doc.operatorAddress },
//           { $set: doc },
//           { upsert: true }
//         );

//         synced++;
//         if (synced >= MAX_RECORDS) break;
//       }

//       console.log(`Synced batch: skip=${skip}, total=${synced}`);
//       skip += PAGE_SIZE;
//     }
//     console.log('Validator sync complete');
//   } catch (err) {
//     console.error('Validator sync failed:', err);
//   }
// }

// async function fetchAndStoreRewards() {
//   try {
//     // Verify provider
//     const blockNumber = await web3.eth.getBlockNumber();
//     console.log('Current block number:', blockNumber);

//     // Fetch wallet addresses from EigenExplorer API
//     let skip = 0;
//     const PAGE_SIZE = 100;
//     let walletAddresses = [];
//     const maxPages = Math.ceil(MAX_RECORDS / PAGE_SIZE);

//     for (let page = 0; page < maxPages; page++) {
//       const url = `https://api.eigenexplorer.com/stakers?skip=${skip}&take=${PAGE_SIZE}`;
//       const response = await fetch(url, {
//         method: 'GET',
//         headers: { 'X-API-Token': process.env.EIGEN_API_KEY }
//       });

//       const json = await response.json();
//       const stakers = json?.data || [];
//       if (stakers.length === 0) break;

//       walletAddresses.push(...stakers.map(staker => staker.address.toLowerCase()));
//       skip += PAGE_SIZE;
//     }

//     console.log(`Fetched ${walletAddresses.length} wallet addresses`);

//     // Process each wallet address
//     for (const walletAddress of walletAddresses) {
//       if (!web3.utils.isAddress(walletAddress)) {
//         console.warn(`Skipping invalid wallet address: ${walletAddress}`);
//         continue;
//       }

//       const fromBlock = blockNumber - 100000; // Last 100k blocks
//       const toBlock = 'latest';
//       const paddedWallet = '0x' + walletAddress.replace('0x', '').padStart(64, '0');

//       const logs = await web3.eth.getPastLogs({
//         fromBlock,
//         toBlock,
//         address: CONTRACT_ADDRESS,
//         topics: [EVENT_TOPIC, paddedWallet]
//       });

//       // Aggregate rewards by operator
//       const rewardsByOperator = {};
//       for (const log of logs) {
//         const operator = '0x' + log.topics[2].slice(26);
//         const amountHex = log.data.slice(2, 66);
//         const timestampHex = log.data.slice(66, 130);

//         const amount = web3.utils.fromWei(web3.utils.toBN('0x' + amountHex), 'ether');
//         const timestamp = parseInt(timestampHex, 16);

//         if (!rewardsByOperator[operator]) {
//           rewardsByOperator[operator] = {
//             operatorAddress: operator,
//             amountStETH: 0,
//             timestamps: []
//           };
//         }

//         rewardsByOperator[operator].amountStETH = (
//           parseFloat(rewardsByOperator[operator].amountStETH) + parseFloat(amount)
//         ).toFixed(18);
//         rewardsByOperator[operator].timestamps.push(timestamp);
//       }

//       // Skip if no rewards found
//       if (Object.keys(rewardsByOperator).length === 0) {
//         console.log(`No rewards found for ${walletAddress}`);
//         continue;
//       }

//       // Calculate total rewards
//       const totalRewardsReceivedStETH = Object.values(rewardsByOperator)
//         .reduce((sum, op) => sum + parseFloat(op.amountStETH), 0)
//         .toFixed(18);

//       // Prepare document
//       const rewardDoc = {
//         walletAddress,
//         totalRewardsReceivedStETH,
//         rewardsBreakdown: Object.values(rewardsByOperator),
//         lastUpdated: new Date()
//       };

//       // Store in MongoDB
//       await Reward.updateOne(
//         { walletAddress: rewardDoc.walletAddress },
//         { $set: rewardDoc },
//         { upsert: true }
//       );

//       console.log(`Stored rewards for ${walletAddress}:`, rewardDoc);
//     }

//     console.log('Reward sync complete');
//   } catch (err) {
//     console.error('Error in fetchAndStoreRewards:', err);
//     throw err;
//   }
// }

// module.exports = {fetchData,syncValidators,fetchAndStoreRewards};


if (!process.env.EIGEN_API_KEY) {
  throw new Error('EIGEN_API_KEY is not defined in .env');
}


async function withRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err.message.includes('Too Many Requests') && attempt < retries) {
        console.log(`Rate limit hit, retrying (${attempt}/${retries}) after ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      throw err;
    }
  }
}



async function syncValidators() {
  let skip = 0;
  let synced = 0;
  const PAGE_SIZE = 100;
  try {
    while (true) {
      if (synced >= MAX_RECORDS) break;

      const url = `https://api.eigenexplorer.com/operators?skip=${skip}&take=${PAGE_SIZE}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-API-Token': API_KEY }
      });

      const json = await res.json();
      const operators = json?.data || [];
      if (operators.length === 0) break;

      for (const op of operators) {
        const { address, updatedAt, shares } = op;

        const stethShare = shares.find(s => s.strategyAddress.toLowerCase() === STETH_STRATEGY);
        if (!stethShare || stethShare.shares === '0') continue;

        const doc = {
          operatorAddress: address.toLowerCase(),
          totalDelegatedStakeStETH: parseFloat(stethShare.shares) / 1e18,
          status: 'active',
          lastUpdated: new Date(updatedAt).toISOString(),
          slashHistory: []
        };

        await Validator.updateOne(
          { operatorAddress: doc.operatorAddress },
          { $set: doc },
          { upsert: true }
        );

        synced++;
        if (synced >= MAX_RECORDS) break;
      }

      console.log(`Synced жbatch: skip=${skip}, total=${synced}`);
      skip += PAGE_SIZE;
    }
    console.log('Validator sync complete');
  } catch (err) {
    console.error('Validator sync failed:', err);
  }
}

async function fetchAndStoreRewards() {
  try {
    // Verify provider
    const blockNumber = await withRetry(() => web3.eth.getBlockNumber());
    let skip = 0;
    const PAGE_SIZE = 100;
    let walletAddresses = [];
    const maxPages = Math.ceil(MAX_RECORDS / PAGE_SIZE);

    for (let page = 0; page < maxPages; page++) {
      const url = `https://api.eigenexplorer.com/stakers?skip=${skip}&take=${PAGE_SIZE}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-API-Token': API_KEY }
      });

      const json = await response.json();
      const stakers = json?.data || [];
      if (stakers.length === 0) break;

      walletAddresses.push(...stakers.map(staker => staker.address.toLowerCase()));
      skip += PAGE_SIZE;
    }
    for (let i = 0; i < walletAddresses.length; i += BATCH_SIZE) {
      const batch = walletAddresses.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} with ${batch.length} addresses`);

      const logs = await withRetry(() =>
        web3.eth.getPastLogs({
          fromBlock: blockNumber - BLOCK_RANGE,
          toBlock: 'latest',
          address: CONTRACT_ADDRESS,
          topics: [EVENT_TOPIC]
        })
      );

      const rewardsByWallet = {};
      for (const log of logs) {
        const walletAddress = '0x' + log.topics[1].slice(26);
        const operator = '0x' + log.topics[2].slice(26);
        const amountHex = log.data.slice(2, 66);
        const timestampHex = log.data.slice(66, 130);

        const amount = web3.utils.fromWei(web3.utils.toBN('0x' + amountHex), 'ether');
        const timestamp = parseInt(timestampHex, 16);

        if (!batch.includes(walletAddress)) continue;

        if (!rewardsByWallet[walletAddress]) {
          rewardsByWallet[walletAddress] = {
            walletAddress,
            rewardsByOperator: {}
          };
        }

        if (!rewardsByWallet[walletAddress].rewardsByOperator[operator]) {
          rewardsByWallet[walletAddress].rewardsByOperator[operator] = {
            operatorAddress: operator,
            amountStETH: 0,
            timestamps: []
          };
        }

        rewardsByWallet[walletAddress].rewardsByOperator[operator].amountStETH = (
          parseFloat(rewardsByWallet[walletAddress].rewardsByOperator[operator].amountStETH) +
          parseFloat(amount)
        ).toFixed(18);
        rewardsByWallet[walletAddress].rewardsByOperator[operator].timestamps.push(timestamp);
      }

      for (const walletAddress of batch) {
        const walletData = rewardsByWallet[walletAddress];
        if (!walletData || Object.keys(walletData.rewardsByOperator).length === 0) {
          console.log(`No rewards found for ${walletAddress}`);
          continue;
        }

        const totalRewardsReceivedStETH = Object.values(walletData.rewardsByOperator)
          .reduce((sum, op) => sum + parseFloat(op.amountStETH), 0)
          .toFixed(18);

        const rewardDoc = {
          walletAddress,
          totalRewardsReceivedStETH,
          rewardsBreakdown: Object.values(walletData.rewardsByOperator),
          lastUpdated: new Date()
        };

        await Reward.updateOne(
          { walletAddress: rewardDoc.walletAddress },
          { $set: rewardDoc },
          { upsert: true }
        );
      }
    }
  } catch (err) {
    console.error('Error in fetchAndStoreRewards:', err);
    throw err;
  }
}

const executeAllDataFetching = async () => {
  try {
    console.log('Starting data fetch...');
    await fetchData();
    console.log('Data fetch complete');

    console.log('Starting validator sync...');
    await syncValidators();
    console.log('Validator sync complete');

    console.log('Starting rewards fetch and store...');
    await fetchAndStoreRewards();
    console.log('Rewards fetch and store complete');
  } catch (err) {
    console.error('Error in executeAllDataFetching:', err);
  }
}


module.exports = { executeAllDataFetching , syncValidators};