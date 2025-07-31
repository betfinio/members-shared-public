// biome-ignore lint/style/useImportType: not supported
import { NewMember, NewMember as NewMemberEvent } from "../generated/Pass/Pass";
import { Member, LinearData, BinaryData } from "../generated/schema";
// biome-ignore lint/suspicious/noShadowRestrictedNames: shadowing
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
// biome-ignore lint/style/useImportType: not supported
import { Staked } from "../generated/ConservativeStaking/ConservativeStaking";
// biome-ignore lint/style/useImportType: not supported
import { NewBet } from "../generated/BetsMemory/BetsMemory";
import { BetInterface } from "../generated/BetsMemory/BetInterface";
// biome-ignore lint/style/useImportType: not supported
import { Affiliate, NewMatchingBonus } from "../generated/Affiliate/Affiliate";
import { log, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";
// reviewed
function createMember(event: NewMemberEvent): void {
	const member = new Member(event.params.member);
	const linearData = new LinearData(event.params.member);
	const binaryData = new BinaryData(event.params.member);

	linearData.id = event.params.member;
	linearData.member = event.params.member;
	linearData.directCount = BigInt.zero();
	linearData.linearCount = BigInt.zero();
	linearData.stakingDirect = BigInt.zero();
	linearData.stakingLinear = BigInt.zero();
	linearData.bettingDirect = BigInt.zero();
	linearData.bettingLinear = BigInt.zero();
	linearData.path = [];
	linearData.linearLevel = BigInt.zero();
	linearData.save();

	binaryData.id = event.params.member;
	binaryData.member = event.params.member;
	binaryData.side = "";
	binaryData.leftCount = BigInt.zero();
	binaryData.rightCount = BigInt.zero();
	binaryData.stakingLeft = BigInt.zero();
	binaryData.stakingRight = BigInt.zero();
	binaryData.bettingLeft = BigInt.zero();
	binaryData.bettingRight = BigInt.zero();
	binaryData.totalMatched = BigInt.zero();
	binaryData.totalVolume = BigInt.zero();
	binaryData.binaryLevel = BigInt.zero();
	binaryData.weakVolume = BigInt.zero();
	binaryData.strongVolume = BigInt.zero();
	binaryData.save();

	member.id = event.params.member;
	member.member = event.params.member;
	member.name = event.params.member.toHexString();

	member.left = null;
	member.right = null;

	member.staking = BigInt.zero();
	member.betting = BigInt.zero();

	member.isInviting = false;
	member.isMatching = false;

	member.bonus = BigInt.zero();
	member.lastUpdatedBonus = BigInt.zero();

	member.created = event.block.timestamp;
	member.linearData = linearData.id;
	member.binaryData = binaryData.id;

	// check if member is root
	if (event.params.parent.equals(Address.zero())) {
		member.inviter = null;
		member.parent = null;
		member.save();
		return;
	}

	// find suitable parent
	const initial = Member.load(event.params.parent);
	if (!initial) {
		throw new Error("Parent does not exist");
	}
	const parent: Member = findParent(initial);

	const inviter = Member.load(event.params.inviter);
	if (!inviter) {
		throw new Error("Inviter does not exist");
	}
	member.inviter = inviter.id;
	member.parent = parent.id;

	const parentBinaryData = BinaryData.load(parent.member);
	if (!parentBinaryData) {
		throw new Error("Parent binary data does not exist");
	}
	// determine member side & update parent
	if (parentBinaryData.leftCount.equals(BigInt.zero())) {
		parentBinaryData.leftCount = BigInt.fromI32(1);
		binaryData.side = parentBinaryData.side.concat("L");
		parent.left = member.id;
	} else {
		parentBinaryData.rightCount = BigInt.fromI32(1);
		binaryData.side = parentBinaryData.side.concat("R");
		parent.right = member.id;
	}

	binaryData.binaryLevel = parentBinaryData.binaryLevel.plus(BigInt.fromI32(1));

	member.save();
	parent.save();
	binaryData.save();
	parentBinaryData.save();

	// recursive parent counters updates (binary data)
	let current = parent;
	while (current.parent !== null) {
		const parentAddress = current.parent;
		if (!parentAddress) {
			throw new Error("Parent does not exist");
		}
		const parent = Member.load(parentAddress);
		if (!parent) {
			throw new Error("Parent does not exist");
		}
		const parentBinaryData = BinaryData.load(parent.id);
		if (!parentBinaryData) {
			throw new Error("Parent data does not exist");
		}
		// biome-ignore lint/style/noNonNullAssertion: not supported
		if (parent.left && parent.left!.equals(current.member)) {
			parentBinaryData.leftCount = parentBinaryData.leftCount.plus(
				BigInt.fromI32(1),
			);
		} else {
			parentBinaryData.rightCount = parentBinaryData.rightCount.plus(
				BigInt.fromI32(1),
			);
		}
		parentBinaryData.save();
		current = parent;
	}

	const inviterLinearData = LinearData.load(inviter.id);
	if (!inviterLinearData) {
		throw new Error("Inviter data does not exist");
	}
	inviterLinearData.directCount = inviterLinearData.directCount.plus(
		BigInt.fromI32(1),
	);
	inviterLinearData.save();
	const path = inviterLinearData.path.concat([inviter.id]);
	linearData.path = path;
	linearData.linearLevel = inviterLinearData.linearLevel.plus(
		BigInt.fromI32(1),
	);
	linearData.save();

	// recursive inviters counters updates (linear data)
	let currentMember = member;

	while (currentMember.inviter !== null) {
		const inviterAddress = currentMember.inviter;
		if (!inviterAddress) {
			throw new Error("Inviter does not exist");
		}
		const inviter = Member.load(inviterAddress);
		if (!inviter) {
			throw new Error("Inviter does not exist");
		}
		const inviterLinearData = LinearData.load(inviter.id);
		if (!inviterLinearData) {
			throw new Error("Inviter data does not exist");
		}
		inviterLinearData.linearCount = inviterLinearData.linearCount.plus(
			BigInt.fromI32(1),
		);
		inviterLinearData.save();
		currentMember = inviter;
	}
}

export function createNewMemberEvent(
	member: Address,
	inviter: Address,
	parent: Address,
): NewMember {
	const newMemberEvent = changetype<NewMember>(newMockEvent());

	newMemberEvent.parameters = [];

	newMemberEvent.parameters.push(
		new ethereum.EventParam("member", ethereum.Value.fromAddress(member)),
	);
	newMemberEvent.parameters.push(
		new ethereum.EventParam("inviter", ethereum.Value.fromAddress(inviter)),
	);
	newMemberEvent.parameters.push(
		new ethereum.EventParam("parent", ethereum.Value.fromAddress(parent)),
	);

	return newMemberEvent;
}

export function handleNewMember(event: NewMemberEvent): void {
	// removed irrelevant code here 
	createMember(event);
}

// reviewed
function findParent(parent: Member): Member {
	const parentBinaryData = BinaryData.load(parent.member);
	if (!parentBinaryData) {
		throw new Error("Initial data does not exist");
	}
	if (parentBinaryData.leftCount.equals(BigInt.zero())) {
		return parent;
	}
	if (parentBinaryData.rightCount.equals(BigInt.zero())) {
		return parent;
	}
	if (
		parentBinaryData.leftCount.le(parentBinaryData.rightCount) &&
		parent.left !== null
	) {
		const leftAddress = parent.left;
		if (!leftAddress) {
			throw new Error("SNH: left is null");
		}
		const potential = Member.load(leftAddress);
		if (potential) {
			return findParent(potential);
		}
		throw new Error("SNH: left is null");
	}
	if (
		parentBinaryData.rightCount.lt(parentBinaryData.leftCount) &&
		parent.right !== null
	) {
		const rightAddress = parent.right;
		if (!rightAddress) {
			throw new Error("SNH: right is null");
		}
		const potential = Member.load(rightAddress);
		if (potential) {
			return findParent(potential);
		}
		throw new Error("SNH: right is null");
	}
	throw new Error("SNH: parent is null");
}

export function handleStaked(event: Staked): void {
	const AFFILIATE = Address.fromBytes(
		dataSource.context().getBytes("affiliate"),
	);
	const memberAddress = event.params.staker;
	const member = Member.load(memberAddress);
	const amount = event.params.amount;
	if (!member) {
		throw new Error("Member does not exist");
	}
	// update member's staking
	member.staking = member.staking.plus(amount);
	const invite = Affiliate.bind(AFFILIATE).checkInviteCondition(memberAddress);
	const matching =
		Affiliate.bind(AFFILIATE).checkMatchingCondition(memberAddress);
	member.isInviting = invite;
	member.isMatching = matching;
	member.save();

	// recursive update of member's parents staking volume (binary data)
	let current = member;
	while (current.parent !== null) {
		const parentAddress = current.parent;
		if (!parentAddress) {
			throw new Error("Parent does not exist");
		}
		const parent = Member.load(parentAddress);
		if (!parent) {
			throw new Error("Parent does not exist");
		}
		const parentBinaryData = BinaryData.load(parent.id);
		if (!parentBinaryData) {
			throw new Error("Parent data does not exist");
		}
		// biome-ignore lint/style/noNonNullAssertion: not supported
		if (parent.left && parent.left!.equals(current.member)) {
			parentBinaryData.stakingLeft = parentBinaryData.stakingLeft.plus(amount);
			// biome-ignore lint/style/noNonNullAssertion: not supported
		} else if (parent.right && parent.right!.equals(current.member)) {
			parentBinaryData.stakingRight =
				parentBinaryData.stakingRight.plus(amount);
		} else {
			// should not happen
			throw new Error("Member does not belong to parent");
		}
		const matchedLeft = parentBinaryData.stakingLeft.plus(
			parentBinaryData.bettingLeft.div(BigInt.fromI64(100)),
		);
		const matchedRight = parentBinaryData.stakingRight.plus(
			parentBinaryData.bettingRight.div(BigInt.fromI64(100)),
		);
		// matched is minimum of matchedLeft and matchedRight
		parentBinaryData.totalMatched = matchedLeft.lt(matchedRight)
			? matchedLeft
			: matchedRight;
		parentBinaryData.totalVolume = matchedLeft.plus(matchedRight);
		parentBinaryData.weakVolume = matchedLeft.ge(matchedRight)
			? matchedRight
			: matchedLeft;
		parentBinaryData.strongVolume = matchedRight.gt(matchedLeft)
			? matchedRight
			: matchedLeft;
		parentBinaryData.save();
		parent.isMatching = Affiliate.bind(AFFILIATE).checkMatchingCondition(
			Address.fromBytes(parentAddress),
		);
		parent.isInviting = Affiliate.bind(AFFILIATE).checkInviteCondition(
			Address.fromBytes(parentAddress),
		);
		parent.save();
		current = parent;
	}

	// recursive update of inviter's staking volume
	current = member;
	while (current.inviter !== null) {
		const inviterAddress = current.inviter;
		if (!inviterAddress) {
			throw new Error("Inviter does not exist");
		}
		const inviter = Member.load(inviterAddress);
		if (!inviter) {
			throw new Error("Inviter does not exist");
		}
		const inviterLinearData = LinearData.load(inviter.id);
		if (!inviterLinearData) {
			throw new Error("Inviter data does not exist");
		}
		inviterLinearData.stakingLinear =
			inviterLinearData.stakingLinear.plus(amount);
		inviterLinearData.save();
		current = inviter;
	}

	if (member.inviter === null) return;
	// update inviter's staking volume (linear data)
	const inviterAddress = member.inviter;
	if (!inviterAddress) {
		throw new Error("Inviter does not exist");
	}
	const inviter = Member.load(inviterAddress);
	if (!inviter) {
		throw new Error("Inviter does not exist");
	}
	const inviterLinearData = LinearData.load(inviter.id);
	if (!inviterLinearData) {
		throw new Error("Inviter data does not exist");
	}
	inviterLinearData.stakingDirect =
		inviterLinearData.stakingDirect.plus(amount);
	inviterLinearData.save();
}

export function handleBet(event: NewBet): void {
	const memberAddress = event.params.player;
	const member = Member.load(memberAddress);
	if (!member) {
		// ignore bets from unknown members
		return;
	}
	// update member's betting
	const amount = BetInterface.bind(event.params.bet).getAmount();
	member.betting = member.betting.plus(amount);
	member.save();

	// recursive update of member's parents betting volume (binary data)
	let current = member;
	while (current.parent !== null) {
		const parentAddress = current.parent;
		if (!parentAddress) {
			throw new Error("Parent does not exist");
		}
		const parent = Member.load(parentAddress);
		if (!parent) {
			throw new Error("Parent does not exist");
		}
		const parentBinaryData = BinaryData.load(parent.id);
		if (!parentBinaryData) {
			throw new Error("Parent data does not exist");
		}
		// biome-ignore lint/style/noNonNullAssertion: not supported
		if (parent.left && parent.left!.equals(current.member)) {
			parentBinaryData.bettingLeft = parentBinaryData.bettingLeft.plus(amount);
			// biome-ignore lint/style/noNonNullAssertion: not supported
		} else if (parent.right && parent.right!.equals(current.member)) {
			parentBinaryData.bettingRight =
				parentBinaryData.bettingRight.plus(amount);
		} else {
			// should not happen
			throw new Error("Member does not belong to parent");
		}
		const matchedLeft = parentBinaryData.stakingLeft.plus(
			parentBinaryData.bettingLeft.div(BigInt.fromI64(100)),
		);
		const matchedRight = parentBinaryData.stakingRight.plus(
			parentBinaryData.bettingRight.div(BigInt.fromI64(100)),
		);
		// matched is minimum of matchedLeft and matchedRight
		parentBinaryData.totalMatched = matchedLeft.lt(matchedRight)
			? matchedLeft
			: matchedRight;
		parentBinaryData.weakVolume = matchedLeft.ge(matchedRight)
			? matchedRight
			: matchedLeft;
		parentBinaryData.strongVolume = matchedRight.gt(matchedLeft)
			? matchedRight
			: matchedLeft;
		parentBinaryData.totalVolume = matchedLeft.plus(matchedRight);
		parentBinaryData.save();
		current = parent;
	}

	// recursive update of inviter's betting volume (linear data)
	current = member;
	while (current.inviter !== null) {
		const inviterAddress = current.inviter;
		if (!inviterAddress) {
			throw new Error("Inviter does not exist");
		}
		const inviter = Member.load(inviterAddress);
		if (!inviter) {
			throw new Error("Inviter does not exist");
		}
		const inviterLinearData = LinearData.load(inviter.id);
		if (!inviterLinearData) {
			throw new Error("Inviter data does not exist");
		}
		inviterLinearData.bettingLinear =
			inviterLinearData.bettingLinear.plus(amount);
		inviterLinearData.save();
		current = inviter;
	}

	if (member.inviter === null) return;
	// update inviter's betting volume (linear data)
	const inviterAddress = member.inviter;
	if (!inviterAddress) {
		throw new Error("Inviter does not exist");
	}
	const inviter = Member.load(inviterAddress);
	if (!inviter) {
		throw new Error("Inviter does not exist");
	}
	const inviterLinearData = LinearData.load(inviter.member);
	if (!inviterLinearData) {
		throw new Error("Inviter data does not exist");
	}
	inviterLinearData.bettingDirect =
		inviterLinearData.bettingDirect.plus(amount);
	inviterLinearData.save();
}

export function handleBonus(event: NewMatchingBonus): void {
	const member = Member.load(event.params.member);
	if (!member) {
		throw new Error("Member does not exist");
	}
	member.bonus = member.bonus.plus(event.params.amount);
	member.lastUpdatedBonus = event.block.timestamp;
	member.save();
}
