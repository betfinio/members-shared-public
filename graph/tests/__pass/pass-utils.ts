/** biome-ignore-all lint/style/useImportType: not supported */
/** biome-ignore-all lint/complexity/noStaticOnlyClass: todo */
/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: shadowing */

import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts"
import { newMockEvent } from "matchstick-as"
import { NewMember } from "../../generated/Pass/Pass"
import { ETHER } from "../../src/utils/numbers"

export function createNewMemberEvent(
	member: Address,
	inviter: Address,
	parent: Address
): NewMember {
	const newMemberEvent = changetype<NewMember>(newMockEvent())

	newMemberEvent.parameters = []

	newMemberEvent.parameters.push(
		new ethereum.EventParam("member", ethereum.Value.fromAddress(member))
	)
	newMemberEvent.parameters.push(
		new ethereum.EventParam("inviter", ethereum.Value.fromAddress(inviter))
	)
	newMemberEvent.parameters.push(
		new ethereum.EventParam("parent", ethereum.Value.fromAddress(parent))
	)

	return newMemberEvent
}


export class Ether {
	static fromWei(amount: BigInt): string {
		return amount.div(ETHER).toString();
	}

	static toWei(amount: BigInt): string {
		return amount.times(ETHER).toString();
	}
	static getWeiString(amount: BigInt): string {
		return amount.times(ETHER).toString();
	}

	static getWeiBigInt(amount: BigInt): BigInt {
		return amount.times(ETHER);
	}
}