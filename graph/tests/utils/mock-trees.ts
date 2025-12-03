/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: todo */
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { handleNewMember } from "../../src/pass";
import { getAddress } from "../../src/utils/ids";
import { BASE_TIMESTAMP, FIVE_MINUTES, ONE_DAY, ONE_WEEK } from "../../src/utils/time";
import { createNewMemberEvent } from "../__pass/pass-utils";
import { createMockedFunctionAffiliate_checkInviteCondition, createMockedFunctionAffiliate_checkMatchingCondition } from "./mocked-functions";

const timestamp = BASE_TIMESTAMP; // BigInt.fromI32(NEW_YEAR_2025_TIMESTAMP.toI32()); //2025-01-01 00:00:00;

/**
 * Creates a binary tree structure with 5 members:
                    1 (root)
                  /           \
                2(10)         3(100)
              /     \        /     \
            4(100)   6(100) 5(100)  7(50)
                                   /
                                  8(100)

 */
export const createBaseTree = (): Array<Address> => {
	const rootAddress = getAddress(1);
	const rootMemberEvent = createNewMemberEvent(rootAddress, Address.zero(), Address.zero());
	rootMemberEvent.block.timestamp = timestamp;
	handleNewMember(rootMemberEvent);

	createMockedFunctionAffiliate_checkInviteCondition(rootAddress, true);
	createMockedFunctionAffiliate_checkMatchingCondition(rootAddress, true);

	const aliceAddress = getAddress(2);
	const aliceMemberEvent = createNewMemberEvent(aliceAddress, rootAddress, rootAddress);
	aliceMemberEvent.block.timestamp = timestamp.plus(FIVE_MINUTES);
	handleNewMember(aliceMemberEvent);

	createMockedFunctionAffiliate_checkInviteCondition(aliceAddress, true);
	createMockedFunctionAffiliate_checkMatchingCondition(aliceAddress, true);

	const bobAddress = getAddress(3);
	const bobMemberEvent = createNewMemberEvent(bobAddress, rootAddress, rootAddress);
	bobMemberEvent.block.timestamp = timestamp.plus(ONE_DAY);
	handleNewMember(bobMemberEvent);

	createMockedFunctionAffiliate_checkInviteCondition(bobAddress, true);
	createMockedFunctionAffiliate_checkMatchingCondition(bobAddress, true);

	const charlieAddress = getAddress(4);
	const charlieMemberEvent = createNewMemberEvent(charlieAddress, rootAddress, rootAddress);
	charlieMemberEvent.block.timestamp = timestamp.plus(ONE_WEEK);
	handleNewMember(charlieMemberEvent);

	createMockedFunctionAffiliate_checkInviteCondition(charlieAddress, true);
	createMockedFunctionAffiliate_checkMatchingCondition(charlieAddress, true);

	const daveAddress = getAddress(5);
	const daveMemberEvent = createNewMemberEvent(daveAddress, rootAddress, rootAddress);
	daveMemberEvent.block.timestamp = timestamp.plus(ONE_WEEK.times(BigInt.fromI32(2)));
	handleNewMember(daveMemberEvent);

	createMockedFunctionAffiliate_checkInviteCondition(daveAddress, true);
	createMockedFunctionAffiliate_checkMatchingCondition(daveAddress, true);

	const andyAddress = getAddress(6);
	const andyMemberEvent = createNewMemberEvent(andyAddress, rootAddress, rootAddress);
	andyMemberEvent.block.timestamp = timestamp.plus(ONE_WEEK.times(BigInt.fromI32(3)));
	handleNewMember(andyMemberEvent);

	createMockedFunctionAffiliate_checkInviteCondition(andyAddress, false);
	createMockedFunctionAffiliate_checkMatchingCondition(andyAddress, false);

	const ericAddress = getAddress(7);
	const ericMemberEvent = createNewMemberEvent(ericAddress, rootAddress, rootAddress);
	ericMemberEvent.block.timestamp = timestamp.plus(ONE_WEEK.times(BigInt.fromI32(3)));
	handleNewMember(ericMemberEvent);

	createMockedFunctionAffiliate_checkInviteCondition(ericAddress, false);
	createMockedFunctionAffiliate_checkMatchingCondition(ericAddress, false);

	const tedAddress = getAddress(8);
	const tedMemberEvent = createNewMemberEvent(tedAddress, ericAddress, ericAddress);
	tedMemberEvent.block.timestamp = timestamp.plus(ONE_WEEK.times(BigInt.fromI32(3)));
	handleNewMember(tedMemberEvent);

	createMockedFunctionAffiliate_checkInviteCondition(tedAddress, false);
	createMockedFunctionAffiliate_checkMatchingCondition(tedAddress, false);

	return [rootAddress, aliceAddress, bobAddress, charlieAddress, daveAddress, andyAddress, ericAddress, tedAddress];
};
