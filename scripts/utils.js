
import { existsSync, readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";
import { config } from "../config.js";


export function chunkArray(myArray, chunk_size) {
  let index = 0;
  const arrayLength = myArray.length;
  const tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    const myChunk = myArray.slice(index, index + chunk_size);
    tempArray.push(myChunk);
  }
  return tempArray;
}


export async function doViaChunks(_array,
  _doFn,
  _chunkSize = 10) {
  try {
    let results = [];
    const chunks = chunkArray(_array, _chunkSize);
    for (const chunk of chunks) {
      const result = await doForChunk(chunk, _doFn);
      results = results.concat(...Array(result));
    }

    async function doForChunk(_chunk, _doFn) {
      const data = _chunk.map(async (instance) => await _doFn(instance));
      return Promise.all(data);
    }
    results = results.filter(function (el) {
      return el !== undefined;
    });
    return results;
  } catch (e) {
    console.log(e);
  }
}


export async function saveJSON(json,
  fileName,
  clearOld) {
  if (typeof json === "string")
    json = JSON.parse(json);
  const path = `${fileName}.json`;
  let obj = {};
  if (existsSync(path))
    obj = JSON.parse(readFileSync(path).toString());
  let final;
  if (clearOld) {
    final = json;
  } else {
    final = mergeDeep(obj, json);
  }
  writeFileSync(path, JSON.stringify(final));
}


export function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}


export function mergeDeep(target, source) {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key])
          Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}


export async function loadWallets(path, provider) {
  if (existsSync(path)) {
    const content = readFileSync(path).toString().split("\n")
    const wallets = []
    const createWalletObj = async (splittedLine) => {
      const lines = splittedLine.split(":")
      wallets.push({
        wallet: new ethers.Wallet(lines[0], provider),
        dstAddress: lines[1]
      })
    }
    await doViaChunks(content, createWalletObj)
    return wallets;
  } else {
    throw Error(`Wallets file does not exists`);
  }
}


export async function getAmounts(
  walletsObjs,
  arbiClaimContract
) {
  const getClaimAmount = async (walletsObj) => {
    let claimableAmount = await arbiClaimContract.claimableTokens(walletsObj.wallet.address);
    const percentToLeave = generateRandomMultiple100(config.LEAVE_ON_WALLET_MIN, config.LEAVE_ON_WALLET_MAX)
    claimableAmount = claimableAmount.div(10000).mul(10000 - percentToLeave).toString()
    walletsObj.amount = claimableAmount
  }
  await doViaChunks(walletsObjs, getClaimAmount, 5)
  return walletsObjs;
}


export function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

export function generateRandomMultiple100(min, max) {
  let difference = max - min;
  let rand = Math.random();
  rand = parseInt((rand * difference + min) * 100);
  return rand;
}
