import { newMockEvent } from "matchstick-as"
import { Address, ethereum } from "@graphprotocol/graph-ts"
import { NewMember } from "../generated/Pass/Pass"

export function createNewMemberEvent(
	member: Address,
	inviter: Address,
	parent: Address
): NewMember {
	let newMemberEvent = changetype<NewMember>(newMockEvent())
	
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