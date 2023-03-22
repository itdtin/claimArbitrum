import { ethers } from "ethers";
import { config } from "./config.js";
import { loadWallets, getAmounts, doViaChunks, saveJSON, sleep } from "./scripts/utils.js";
import { CLAIM_ABI, TOKEN_ABI, INFO_CONTRACT_ABI } from "./scripts/abis.js";


async function claim(walletsWithAmount, provider, claimContract, tokenContract) {
  const results = [];

  const claimFoSigner = async (walletObj) => {
    const tempResult = {
      address: walletObj.wallet.address,
      claimTx: null,
      transferTx: null
    }
    const signer = walletObj.wallet
    const recipient = walletObj.dstAddress
    try {
      await claimContract.connect(signer).claim(
        {
          gasLimit: config.GAS_LIMIT,
          gasPrice: config.GAS_PRICE,
          nonce: await provider.getTransactionCount(signer.address)
        }
      )
      tempResult.claimTx = true
    } catch (e) {
      console.log(`An error occurred on wallet ${signer.address} while claiming`);
      tempResult.claimTx = `${e}`;
    }
    try {
      await tokenContract.connect(signer).transfer(
        recipient,
        walletObj.amount,
        {
          gasLimit: config.GAS_LIMIT,
          gasPrice: config.GAS_PRICE,
          nonce: await provider.getTransactionCount(signer.address)
        }
      );
      tempResult.transferTx = true
    } catch (e) {
      console.log(`An error occurred on wallet ${signer.address} while transferring`);
      tempResult.transferTx = `${e}`;
    }
    results.push(tempResult)
    await saveJSON(results, "results", true);
  };
  await doViaChunks(walletsWithAmount, claimFoSigner, config.CHUNCK_SIZE);
  return results
}


async function run() {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC, config.CHAIN_ID);
  const wallets = await loadWallets("./wallets.txt", provider)

  const claimAddr = config.TEST_MODE ? config.CLAIM_ADDR_TEST : config.CLAIM_ADDR
  const arbiTokenAddr = config.TEST_MODE ? config.ARBI_TOKEN_TEST : config.ARBI_TOKEN

  const infoContract = new ethers.Contract(
    config.INFO_CONTRACT,
    INFO_CONTRACT_ABI,
    provider
  );

  const arbiClaimContract = new ethers.Contract(
    claimAddr,
    CLAIM_ABI,
    provider
  );

  const tokenContract = new ethers.Contract(
    arbiTokenAddr,
    TOKEN_ABI,
    provider
  );
  const walletsWithAmount = await getAmounts(wallets, arbiClaimContract);

  if (config.TEST_MODE) {
    const results = await claim(walletsWithAmount, provider, arbiClaimContract, tokenContract);
    console.log(results)
  } else {
    while (true) {
      if ((await infoContract.getL1BlockNumber()).gt("16890400")) {
        const results = await claim(walletsWithAmount, provider, arbiClaimContract, tokenContract);
        console.log(results)
      } else {
        console.log("It's not time to claim");
        await sleep(0.5)
      }
    }
  }

}

run()
