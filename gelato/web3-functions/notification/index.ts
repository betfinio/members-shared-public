import {
  Web3Function,
  type Web3FunctionEventContext
} from "@gelatonetwork/web3-functions-sdk";
import { Bot } from "grammy";
import { type Address, createPublicClient, http, parseAbi, parseEventLogs } from "viem";
import { polygon, polygonAmoy } from "viem/chains";
const NEW_MEMBER_ABI = [
  'event NewMember(address indexed member, address indexed inviter, address indexed parent)',
] as const

const TRANSFER_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
] as const

function truncateAddress(address: Address) {
  // 0x1234567890123456789012345678901234567890 => 0x123...890
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

Web3Function.onRun(async (context: Web3FunctionEventContext) => {
  const { log, gelatoArgs, secrets } = context;
  const rpc = await secrets.get("RPC_URL");
  const token = await secrets.get("BOT_TOKEN") || "";
  const chatId = await secrets.get("CHAT_ID") || "";
  const bot = new Bot(token);


  const client = createPublicClient({
    chain: gelatoArgs.chainId === 137 ? polygon : polygonAmoy,
    transport: http(rpc),
  });

  const BASE_URL = gelatoArgs.chainId === 137 ? "https://polygonscan.com" : "https://amoy.polygonscan.com"

  const event = parseEventLogs({
    abi: parseAbi(NEW_MEMBER_ABI),
    logs: [{
      address: log.address as Address,
      data: log.data as Address,
      topics: log.topics as [Address, ...Address[]],
      blockNumber: BigInt(log.blockNumber),
      removed: log.removed,
      blockHash: log.blockHash as Address,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
      transactionHash: log.transactionHash as Address
    }],
    strict: true
  })[0]

  // get token id, fetch logs in selected block
  const logs = await client.getContractEvents({
    address: log.address as Address,
    eventName: "Transfer",
    abi: parseAbi(TRANSFER_ABI),
    fromBlock: BigInt(log.blockNumber),
    toBlock: BigInt(log.blockNumber)
  })

  const tokenId = logs.find((log) => log.args.to === event.args.member)?.args.tokenId

  const result = {
    member: event.args.member,
    inviter: event.args.inviter,
    parent: event.args.parent,
    tokenId: tokenId
  }

  const message = `New member: [${truncateAddress(result.member)}](${`${BASE_URL}/address/${result.member}`})
Inviter: [${truncateAddress(result.inviter)}](${`${BASE_URL}/address/${result.inviter}`})
Parent: [${truncateAddress(result.parent)}](${`${BASE_URL}/address/${result.parent}`})
Block: [${log.blockNumber}](${`${BASE_URL}/tx/${log.transactionHash}`})
Token ID: [${result.tokenId}](${`${BASE_URL}/nft/${log.address}/${result.tokenId}`})`

  await bot.api.sendMessage(chatId, message, { parse_mode: "Markdown", link_preview_options: { is_disabled: true } });

  return {
    canExec: false,
    message: "Notification sent"
  };
});
