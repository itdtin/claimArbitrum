# Claim Arbitrum airdrop

# SetUp

1. yarn - will install all dependencies.
2. Create file called wallets.txt in the root.
   Each line in this file must be pk:address, where address - it's destination address to tranfer tokens
3. Setup your RPC url in config.js
4. Setup GAS_LIMIT in config.js if need. Default is 1_500_000
5. Setup CHUNCK_SIZE in config.js. The default value is 5. This option means how many requests to claim will running in the same time

# Run

node claim.js
