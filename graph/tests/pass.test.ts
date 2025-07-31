import { afterEach, assert, beforeAll, clearStore, describe, test } from "matchstick-as"
import { createNewMemberEvent } from "./pass-utils";
import { handleNewMember } from "../src/pass";
import { Address } from "@graphprotocol/graph-ts";

describe("Member entity creation and management", () => {
	beforeAll(() => {

	})

	afterEach(() => {
		clearStore()
	})

	test("Root member created and stored", () => {
		const rootAddress = getAddress(1);
		const rootMember = createNewMemberEvent(rootAddress, Address.zero(), Address.zero());
		handleNewMember(rootMember);

		// Check Member entity
		assert.fieldEquals('Member', rootAddress.toHexString(), 'member', rootAddress.toHexString())
		assert.fieldEquals('Member', rootAddress.toHexString(), 'name', rootAddress.toHexString())
		assert.fieldEquals('Member', rootAddress.toHexString(), 'left', 'null')
		assert.fieldEquals('Member', rootAddress.toHexString(), 'right', 'null')
		assert.fieldEquals('Member', rootAddress.toHexString(), 'staking', "0")
		assert.fieldEquals('Member', rootAddress.toHexString(), 'betting', "0")
		assert.fieldEquals('Member', rootAddress.toHexString(), 'isInviting', "false")
		assert.fieldEquals('Member', rootAddress.toHexString(), 'isMatching', "false")
		assert.fieldEquals('Member', rootAddress.toHexString(), 'bonus', "0")

		// Check BinaryData entity
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'member', rootAddress.toHexString())
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'leftCount', "0")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'rightCount', "0")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'side', "")

		// Check LinearData entity
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'member', rootAddress.toHexString())
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'directCount', "0")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'linearCount', "0")
	})

	test("Direct children members created and stored", () => {
		const rootAddress = getAddress(1);
		const rootMember = createNewMemberEvent(rootAddress, Address.zero(), Address.zero());
		handleNewMember(rootMember);

		// Add first child (should go to left)
		handleNewMember(createNewMemberEvent(getAddress(2), rootAddress, rootAddress));

		// Check root's Member entity updates
		assert.fieldEquals('Member', rootAddress.toHexString(), 'left', getAddress(2).toHexString())
		assert.fieldEquals('Member', rootAddress.toHexString(), 'right', 'null')

		// Check root's BinaryData updates
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'rightCount', "0")

		// Check root's LinearData updates
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'directCount', "1")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'linearCount', "1")

		// Check left child properties (Member entity)
		assert.fieldEquals('Member', getAddress(2).toHexString(), 'left', 'null')
		assert.fieldEquals('Member', getAddress(2).toHexString(), 'right', 'null')
		assert.fieldEquals('Member', getAddress(2).toHexString(), 'member', getAddress(2).toHexString())

		// Check left child's BinaryData
		assert.fieldEquals('BinaryData', getAddress(2).toHexString(), 'leftCount', "0")
		assert.fieldEquals('BinaryData', getAddress(2).toHexString(), 'rightCount', "0")
		assert.fieldEquals('BinaryData', getAddress(2).toHexString(), 'side', "L")

		// Check left child's LinearData
		assert.fieldEquals('LinearData', getAddress(2).toHexString(), 'directCount', "0")
		assert.fieldEquals('LinearData', getAddress(2).toHexString(), 'linearCount', "0")

		// Add second child (should go to right)
		handleNewMember(createNewMemberEvent(getAddress(3), rootAddress, rootAddress));

		// Check root updates (Member entity)
		assert.fieldEquals('Member', rootAddress.toHexString(), 'left', getAddress(2).toHexString())
		assert.fieldEquals('Member', rootAddress.toHexString(), 'right', getAddress(3).toHexString())

		// Check root's BinaryData updates
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'rightCount', "1")

		// Check root's LinearData updates
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'directCount', "2")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'linearCount', "2")

		// Check right child properties (BinaryData)
		assert.fieldEquals('BinaryData', getAddress(3).toHexString(), 'leftCount', "0")
		assert.fieldEquals('BinaryData', getAddress(3).toHexString(), 'rightCount', "0")
		assert.fieldEquals('BinaryData', getAddress(3).toHexString(), 'side', "R")
	})

	test("Large number of members created under root", () => {
		const rootAddress = getAddress(1);
		const rootMember = createNewMemberEvent(rootAddress, Address.zero(), Address.zero());
		handleNewMember(rootMember);

		// Add 1000 members under root
		for (let i = 2; i <= 1002; i++) {
			handleNewMember(createNewMemberEvent(getAddress(i), rootAddress, rootAddress));
		}

		// Check root's binary data
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'leftCount', "501")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'rightCount', "500")
		assert.fieldEquals('Member', rootAddress.toHexString(), 'left', getAddress(2).toHexString())
		assert.fieldEquals('Member', rootAddress.toHexString(), 'right', getAddress(3).toHexString())

		// Check root's linear data
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'directCount', "1001")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'linearCount', "1001")
	})

	test("Linear chain creation on left side", () => {
		const rootAddress = getAddress(1);
		handleNewMember(createNewMemberEvent(rootAddress, Address.zero(), Address.zero()));

		// Create a chain where each member is the parent of the next
		handleNewMember(createNewMemberEvent(getAddress(2), rootAddress, rootAddress));
		handleNewMember(createNewMemberEvent(getAddress(3), getAddress(2), getAddress(2)));
		handleNewMember(createNewMemberEvent(getAddress(4), getAddress(3), getAddress(3)));
		handleNewMember(createNewMemberEvent(getAddress(5), getAddress(4), getAddress(4)));
		handleNewMember(createNewMemberEvent(getAddress(6), getAddress(5), getAddress(5)));
		handleNewMember(createNewMemberEvent(getAddress(7), getAddress(6), getAddress(6)));

		// Check root's binary data
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'leftCount', "6")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'rightCount', "0")

		// Check root's linear data (only direct invitee)
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'directCount', "1")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'linearCount', "1")

		// Check level 1 member (first in chain)
		assert.fieldEquals('LinearData', getAddress(2).toHexString(), 'directCount', "1")
		assert.fieldEquals('LinearData', getAddress(2).toHexString(), 'linearCount', "5")

		// Check deepest member
		assert.fieldEquals('BinaryData', getAddress(7).toHexString(), 'leftCount', "0")
		assert.fieldEquals('BinaryData', getAddress(7).toHexString(), 'rightCount', "0")
		assert.fieldEquals('BinaryData', getAddress(7).toHexString(), 'side', "LLLLLL")
		assert.fieldEquals('Member', getAddress(7).toHexString(), 'left', 'null')
		assert.fieldEquals('Member', getAddress(7).toHexString(), 'right', 'null')
	})

	test("Balanced tree with alternating sides", () => {
		const rootAddress = getAddress(1);
		handleNewMember(createNewMemberEvent(rootAddress, Address.zero(), Address.zero()));

		// Level 1
		handleNewMember(createNewMemberEvent(getAddress(2), rootAddress, rootAddress)); // left
		handleNewMember(createNewMemberEvent(getAddress(3), rootAddress, rootAddress)); // right

		// Level 2 - under left node
		handleNewMember(createNewMemberEvent(getAddress(4), getAddress(2), getAddress(2))); // left-left
		handleNewMember(createNewMemberEvent(getAddress(5), getAddress(2), getAddress(2))); // left-right

		// Level 2 - under right node
		handleNewMember(createNewMemberEvent(getAddress(6), getAddress(3), getAddress(3))); // right-left
		handleNewMember(createNewMemberEvent(getAddress(7), getAddress(3), getAddress(3))); // right-right

		// Check level 1 nodes' binary data
		assert.fieldEquals('BinaryData', getAddress(2).toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', getAddress(2).toHexString(), 'rightCount', "1")
		assert.fieldEquals('BinaryData', getAddress(3).toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', getAddress(3).toHexString(), 'rightCount', "1")

		// Check level 1 nodes' linear data
		assert.fieldEquals('LinearData', getAddress(2).toHexString(), 'directCount', "2")
		assert.fieldEquals('LinearData', getAddress(2).toHexString(), 'linearCount', "2")
		assert.fieldEquals('LinearData', getAddress(3).toHexString(), 'directCount', "2")
		assert.fieldEquals('LinearData', getAddress(3).toHexString(), 'linearCount', "2")

		// Check a level 2 node
		assert.fieldEquals('BinaryData', getAddress(5).toHexString(), 'side', "LR")

		// Verify root counts
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'leftCount', "3")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'rightCount', "3")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'directCount', "2")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'linearCount', "2")
	})

	test("Multiple inviters with different parents (invitation chain)", () => {
		const rootAddress = getAddress(1);
		handleNewMember(createNewMemberEvent(rootAddress, Address.zero(), Address.zero()));

		// Member 2 joins under root (both parent and inviter are root)
		handleNewMember(createNewMemberEvent(getAddress(2), rootAddress, rootAddress));

		// Member 3 joins under root, but was invited by Member 2
		handleNewMember(createNewMemberEvent(getAddress(3), getAddress(2), rootAddress));

		// Check LinearData for inviter tracking
		assert.fieldEquals('LinearData', getAddress(2).toHexString(), 'directCount', "1")
		assert.fieldEquals('LinearData', getAddress(1).toHexString(), 'linearCount', "2")

		// Member 4 joins under Member 2 as both parent and inviter
		handleNewMember(createNewMemberEvent(getAddress(4), getAddress(2), getAddress(2)));

		// Member 5 joins under Member 2 as parent but Member 4 as inviter
		handleNewMember(createNewMemberEvent(getAddress(5), getAddress(4), getAddress(2)));

		// Check Member 4 as inviter
		assert.fieldEquals('LinearData', getAddress(4).toHexString(), 'directCount', "1")

		// Check Member 2 binary and linear counts (2 children, 1 direct invite)
		assert.fieldEquals('BinaryData', getAddress(2).toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', getAddress(2).toHexString(), 'rightCount', "1")
		assert.fieldEquals('LinearData', getAddress(2).toHexString(), 'directCount', "1")
		assert.fieldEquals('LinearData', getAddress(2).toHexString(), 'linearCount', "2")
	})

	test("Tree balancing with findParent functionality", () => {
		const rootAddress = getAddress(1);
		handleNewMember(createNewMemberEvent(rootAddress, Address.zero(), Address.zero()));

		// Create first level
		handleNewMember(createNewMemberEvent(getAddress(2), rootAddress, rootAddress)); // left
		handleNewMember(createNewMemberEvent(getAddress(3), rootAddress, rootAddress)); // right

		// Create unbalanced tree with multiple members on left
		for (let i = 4; i <= 10; i++) {
			handleNewMember(createNewMemberEvent(getAddress(i), rootAddress, rootAddress));
		}

		// Check that members are distributed to balance the tree
		// Members 4 and 5 should be under Member 2 (left branch)
		assert.fieldEquals('BinaryData', getAddress(2).toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', getAddress(2).toHexString(), 'rightCount', "1")

		// Members 6 and 7 should be under Member 3 (right branch)
		assert.fieldEquals('BinaryData', getAddress(3).toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', getAddress(3).toHexString(), 'rightCount', "1")

		// Verify total counts at root level
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'leftCount', "5")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'rightCount', "4")

		// All members invited by root
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'directCount', "9")
	})

	test("Verify BinaryData entity structure", () => {
		const rootAddress = getAddress(1);
		handleNewMember(createNewMemberEvent(rootAddress, Address.zero(), Address.zero()));
		handleNewMember(createNewMemberEvent(getAddress(2), rootAddress, rootAddress));

		// Verify BinaryData entity creation and values
		assert.entityCount('BinaryData', 2)
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'member', rootAddress.toHexString())
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'rightCount', "0")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'stakingLeft', "0")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'stakingRight', "0")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'bettingLeft', "0")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'bettingRight', "0")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'totalMatched', "0")
	})

	test("Verify LinearData entity structure", () => {
		const rootAddress = getAddress(1);
		handleNewMember(createNewMemberEvent(rootAddress, Address.zero(), Address.zero()));
		handleNewMember(createNewMemberEvent(getAddress(2), rootAddress, rootAddress));

		// Verify LinearData entity creation and values
		assert.entityCount('LinearData', 2)
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'member', rootAddress.toHexString())
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'directCount', "1")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'linearCount', "1")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'stakingDirect', "0")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'stakingLinear', "0")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'bettingDirect', "0")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'bettingLinear', "0")
	})

	test("Deep tree with complex parent selection", () => {
		const rootAddress = getAddress(1);
		handleNewMember(createNewMemberEvent(rootAddress, Address.zero(), Address.zero()));

		// Create a balanced tree with multiple levels
		// Level 1
		handleNewMember(createNewMemberEvent(getAddress(2), rootAddress, rootAddress)); // left
		handleNewMember(createNewMemberEvent(getAddress(3), rootAddress, rootAddress)); // right

		// Level 2
		handleNewMember(createNewMemberEvent(getAddress(4), getAddress(2), getAddress(2))); // left-left
		handleNewMember(createNewMemberEvent(getAddress(5), getAddress(2), getAddress(2))); // left-right
		handleNewMember(createNewMemberEvent(getAddress(6), getAddress(3), getAddress(3))); // right-left
		handleNewMember(createNewMemberEvent(getAddress(7), getAddress(3), getAddress(3))); // right-right

		// Level 3 - adding more members should trigger parent selection (findParent)
		for (let i = 8; i <= 15; i++) {
			handleNewMember(createNewMemberEvent(getAddress(i), rootAddress, rootAddress));
		}

		// Check distribution at level 2
		assert.fieldEquals('BinaryData', getAddress(4).toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', getAddress(4).toHexString(), 'rightCount', "1")
		assert.fieldEquals('BinaryData', getAddress(5).toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', getAddress(5).toHexString(), 'rightCount', "1")
		assert.fieldEquals('BinaryData', getAddress(6).toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', getAddress(6).toHexString(), 'rightCount', "1")
		assert.fieldEquals('BinaryData', getAddress(7).toHexString(), 'leftCount', "1")
		assert.fieldEquals('BinaryData', getAddress(7).toHexString(), 'rightCount', "0")

		// Verify total counts at root level
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'leftCount', "8")
		assert.fieldEquals('BinaryData', rootAddress.toHexString(), 'rightCount', "7")

		// All invited by root
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'directCount', "10")
		assert.fieldEquals('LinearData', rootAddress.toHexString(), 'linearCount', "10")
	})
})

function getAddress(num: number): Address {
	// Create hex addresses with format: 0x000..000{num}
	const str = num.toString().split('.')[0]
	return Address.fromString("0x".concat("0".repeat(40 - str.length)).concat(str))
}
