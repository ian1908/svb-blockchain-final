// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      from: '0x4d64a30343aad39d18cdf7dfa545336a16308275',
      network_id: '*', // Match any network id
      gas: 4612388  // use this gas limit (check why) 
    }
  }
}
