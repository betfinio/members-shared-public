/** biome-ignore-all assist/source/organizeImports: not supported */
/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: shadowing */
/** biome-ignore-all lint/style/useImportType: not supported */
import { Address, BigInt, Bytes, ethereum, Wrapped } from "@graphprotocol/graph-ts"
import { Staked, Withdraw } from "../../generated/ConservativeStaking/ConservativeStaking"
import { Withdraw as DynamicWithdraw } from "../../generated/DynamicStaking/DynamicStaking"
import { newMockEvent } from "matchstick-as"
import { NewBet } from "../../generated/BetsMemory/BetsMemory"

export function stakedEvent(
    staker: Address,
    amount: BigInt
): Staked {
    const stakedEvent = changetype<Staked>(newMockEvent())

    stakedEvent.parameters = []

    stakedEvent.parameters.push(
        new ethereum.EventParam("staker", ethereum.Value.fromAddress(staker))
    )
    stakedEvent.parameters.push(
        new ethereum.EventParam("amount", ethereum.Value.fromSignedBigInt(amount))
    )


    return stakedEvent
}

export function newBetEvent(
    bet: Address,
    player: Address,
    game: Address
): NewBet {
    const newBetEvent = changetype<NewBet>(newMockEvent())

    newBetEvent.parameters = []

    newBetEvent.parameters.push(
        new ethereum.EventParam("bet", ethereum.Value.fromAddress(bet))
    )
    newBetEvent.parameters.push(
        new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
    )
    newBetEvent.parameters.push(
        new ethereum.EventParam("game", ethereum.Value.fromAddress(game))
    )

    return newBetEvent

}


export function withdrawDynamicEvent(
    pool: Address,
): DynamicWithdraw {
    const withdrawEvent = changetype<DynamicWithdraw>(newMockEvent())
    withdrawEvent.parameters = []
    withdrawEvent.parameters.push(
        new ethereum.EventParam("pool", ethereum.Value.fromAddress(pool))
    )
    return withdrawEvent
}

export function withdrawConservativeEvent(
    pool: Address,
    staker: Address,
): Withdraw {
    const withdrawEvent = changetype<Withdraw>(newMockEvent())
    withdrawEvent.parameters = [

        new ethereum.EventParam("staker", ethereum.Value.fromAddress(staker)),
        new ethereum.EventParam("amount", ethereum.Value.fromSignedBigInt(BigInt.fromI32(0)))
    ]

    const formatedPool = `0x00000000000000000000000000${pool.toHexString().slice(2)}`;
    const log = new ethereum.Log(
        Address.zero(),
        [Bytes.fromHexString("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"), Bytes.fromHexString(formatedPool)],
        Bytes.empty(),
        Bytes.empty(),
        Bytes.empty(),
        Bytes.empty(),
        BigInt.zero(),
        BigInt.zero(),
        BigInt.zero(),
        "---",
        new Wrapped(false)
    )
    withdrawEvent.receipt = new ethereum.TransactionReceipt(
        Bytes.empty(),
        BigInt.zero(),
        Bytes.empty(),
        BigInt.zero(),
        BigInt.zero(),
        BigInt.zero(),
        Address.zero(),
        [log],
        BigInt.zero(),
        Bytes.empty(),
        Bytes.empty()
    )





    return withdrawEvent
}
