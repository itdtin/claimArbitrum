# Claim Arbitrum airdrop

# SetUp

1. yarn - will install all dependencies.
2. Create file called wallets.txt in the root.
   Each line in this file must be pk:address, where address - it's destination address to tranfer tokens
3. Setup your RPC url in config.js
4. Setup GAS_LIMIT in config.js if need. Default is 1_500_000.
5. Setup GAS_PRICE_ADDITION. It's the value to be added to the dynamically gasPrice got from the node.
6. Setup CHUNCK_SIZE in config.js. The default value is 5. This option means how many requests to claim will running in the same time

Note: Gas price is setting up as gasPrice from node + 1Gwei(this option you can change in config.js:)

# Run

node claim.js
