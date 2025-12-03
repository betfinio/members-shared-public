/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: shadowing */
/** biome-ignore-all lint/style/useImportType: not supported */
import { Address, BigInt, Bytes, dataSource, ethereum, log } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";
import { Affiliate, NewInviteStakingCondition, NewMatchingBonus, NewMatchingInviteeCondition, NewMatchingStakingCondition } from "../generated/Affiliate/Affiliate";
import { BetInterface } from "../generated/BetsMemory/BetInterface";
import { NewBet } from "../generated/BetsMemory/BetsMemory";
import { ConservativeStaking, Staked, Withdraw } from "../generated/ConservativeStaking/ConservativeStaking";
import { ConservativeStakingPool } from "../generated/ConservativeStaking/ConservativeStakingPool";
import { DynamicStaking, Withdraw as DynamicWithdraw } from "../generated/DynamicStaking/DynamicStaking";
import { DynamicStakingPool } from "../generated/DynamicStaking/DynamicStakingPool";
import { NewMember, NewMember as NewMemberEvent } from "../generated/Pass/Pass";
import { BinaryData, Conditions, LinearData, Member, UserPoolStake } from "../generated/schema";
import { getUserPoolStakeId } from "./utils/ids";
import { FOUR_WEEKS } from "./utils/time";

// reviewed
function createMember(event: NewMemberEvent): void {
	const memberAddress = event.params.member;
	const member = new Member(memberAddress);

	//Linear

	const linearData = new LinearData(memberAddress);
	linearData.id = memberAddress;
	linearData.member = memberAddress;
	linearData.directCount = 0;
	linearData.linearCount = 0;
	linearData.stakingDirect = BigInt.zero();
	linearData.stakingLinear = BigInt.zero();
	linearData.bettingDirect = BigInt.zero();
	linearData.bettingLinear = BigInt.zero();
	linearData.path = [];
	linearData.linearLevel = 0;
	linearData.save();

	//Binary
	const binaryData = new BinaryData(memberAddress);
	binaryData.id = memberAddress;
	binaryData.member = memberAddress;
	binaryData.side = "";
	binaryData.leftCount = 0;
	binaryData.rightCount = 0;
	binaryData.stakingLeft = BigInt.zero();
	binaryData.stakingRight = BigInt.zero();
	binaryData.bettingLeft = BigInt.zero();
	binaryData.bettingRight = BigInt.zero();
	binaryData.totalMatched = BigInt.zero();
	binaryData.volumeLeft = BigInt.zero();
	binaryData.volumeRight = BigInt.zero();
	binaryData.totalMatchedVolume = BigInt.zero();
	binaryData.totalVolume = BigInt.zero();
	binaryData.binaryLevel = BigInt.zero();
	binaryData.weakVolume = BigInt.zero();
	binaryData.strongVolume = BigInt.zero();
	binaryData.matchedRight = BigInt.zero();
	binaryData.matchedLeft = BigInt.zero();
	binaryData.matchedWeak = BigInt.zero();
	binaryData.matchedStrong = BigInt.zero();
	binaryData.save();

	log.info("createMember: {}, {}, {}", [member.id.toHexString(), linearData.id.toHexString(), binaryData.id.toHexString()]);

	member.id = memberAddress;
	member.member = memberAddress;
	member.name = memberAddress.toHexString();

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

	const inputPartner = event.params.parent;

	// check if member is root
	if (inputPartner.equals(Address.zero())) {
		member.inviter = null;
		member.parent = null;
		member.save();
		return;
	}

	// find suitable parent
	const initial = Member.load(inputPartner);
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
		throw new Error("Parent data does not exist");
	}

	// determine member side & update parent
	if (parentBinaryData.leftCount === 0) {
		parentBinaryData.leftCount = 1;
		binaryData.side = parentBinaryData.side.concat("L");
		parent.left = member.id;
	} else {
		parentBinaryData.rightCount = 1;
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
			parentBinaryData.leftCount = parentBinaryData.leftCount + 1;
		} else {
			parentBinaryData.rightCount = parentBinaryData.rightCount + 1;
		}
		parentBinaryData.save();
		current = parent;
	}

	//Linear

	const inviterLinearData = LinearData.load(inviter.id);
	if (!inviterLinearData) {
		throw new Error("Inviter data does not exist");
	}
	inviterLinearData.directCount = inviterLinearData.directCount + 1;

	inviterLinearData.save();
	const path = inviterLinearData.path.concat([inviter.id]);
	linearData.path = path;
	linearData.linearLevel = inviterLinearData.linearLevel + 1;
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
		inviterLinearData.linearCount = inviterLinearData.linearCount + 1;
		inviterLinearData.save();
		currentMember = inviter;
	}
}

export function handleOnce(_call: ethereum.Block): void {
	const conditions = new Conditions(Bytes.fromUTF8("1"));
	const affiliateAddress = Address.fromBytes(dataSource.context().getBytes("affiliate"));
	const affiliate = Affiliate.bind(affiliateAddress);
	conditions.inviteCondition = affiliate.inviteStakingCondition();
	conditions.matchingCondition = affiliate.matchingStakingCondition();
	conditions.matchingInviteeCondition = affiliate.matchingInviteeCondition();
	conditions.inviteConditionLastUpdated = _call.timestamp;
	conditions.matchingConditionLastUpdated = _call.timestamp;
	conditions.matchingInviteeConditionLastUpdated = _call.timestamp;
	conditions.save();
}

export function handleNewMember(event: NewMemberEvent): void {
	createMember(event);
}

// reviewed
function findParent(parent: Member): Member {
	const parentBinaryData = BinaryData.load(parent.member);
	if (!parentBinaryData) {
		throw new Error("Initial data does not exist");
	}
	if (parentBinaryData.leftCount === 0) {
		return parent;
	}
	if (parentBinaryData.rightCount === 0) {
		return parent;
	}
	if (parentBinaryData.leftCount <= parentBinaryData.rightCount && parent.left !== null) {
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
	if (parentBinaryData.rightCount < parentBinaryData.leftCount && parent.right !== null) {
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

export function handleConservativeStaked(event: Staked): void {
	handleConservativeStakedUserPoolStake(event);
	handleStaked(event);
}

function getCorrectPool(): Address {
	const CONSERVATIVE_STAKING = Address.fromBytes(dataSource.context().getBytes("conservativeStaking"));
	const contract = ConservativeStaking.bind(CONSERVATIVE_STAKING);
	const maybePool = contract.currentPool();
	if (!maybePool) {
		throw new Error("Pool is null");
	}
	const staked = ConservativeStakingPool.bind(maybePool).totalStaked();
	const poolsCount = contract.getActivePoolCount();

	if (poolsCount.gt(BigInt.fromI64(1))) {
		if (staked.equals(BigInt.fromI64(0))) {
			const correctIndex = poolsCount.minus(BigInt.fromI64(2));
			const correctPool = contract.pools(correctIndex);
			return correctPool;
		}
		return maybePool;
	}
	return maybePool;
}

export function handleConservativeStakedUserPoolStake(event: Staked): void {
	const memberAddress = event.params.staker;

	const pool = getCorrectPool();

	const poolContract = ConservativeStakingPool.bind(pool);

	const poolStart = poolContract.start();
	const poolDuration = poolContract.duration();
	const poolEndDate = poolStart.plus(poolDuration);
	const userPoolStake = UserPoolStake.load(getUserPoolStakeId(memberAddress, pool));
	if (userPoolStake) {
		userPoolStake.amount = userPoolStake.amount.plus(event.params.amount);
		userPoolStake.save();
	} else {
		const newUserPoolStake = new UserPoolStake(getUserPoolStakeId(memberAddress, pool));
		newUserPoolStake.amount = event.params.amount;
		newUserPoolStake.member = memberAddress;
		newUserPoolStake.linearData = memberAddress;
		newUserPoolStake.binaryData = memberAddress;
		newUserPoolStake.pool = pool;
		newUserPoolStake.endDate = poolEndDate;
		newUserPoolStake.staking = event.address;
		newUserPoolStake.unstaked = false;
		newUserPoolStake.unstakedAt = BigInt.zero();
		newUserPoolStake.save();
	}
}

export function handleDynamicStaked(event: Staked): void {
	handleDynamicStakedUserPoolStake(event);
	handleStaked(event);
}

export function handleDynamicStakedUserPoolStake(event: Staked): void {
	const memberAddress = event.params.staker;
	const DYNAMIC_STAKING = Address.fromBytes(dataSource.context().getBytes("dynamicStaking"));
	const poolAddress = DynamicStaking.bind(DYNAMIC_STAKING).currentPool();
	const poolContract = DynamicStakingPool.bind(poolAddress);
	const poolEndDate = poolContract.endCycle().times(FOUR_WEEKS);
	const userPoolStake = UserPoolStake.load(getUserPoolStakeId(memberAddress, poolAddress));
	if (userPoolStake) {
		userPoolStake.amount = userPoolStake.amount.plus(event.params.amount);
		userPoolStake.save();
	} else {
		const newUserPoolStake = new UserPoolStake(getUserPoolStakeId(memberAddress, poolAddress));
		newUserPoolStake.amount = event.params.amount;
		newUserPoolStake.member = memberAddress;
		newUserPoolStake.linearData = memberAddress;
		newUserPoolStake.binaryData = memberAddress;
		newUserPoolStake.pool = poolAddress;
		newUserPoolStake.endDate = poolEndDate;
		newUserPoolStake.staking = event.address;
		newUserPoolStake.unstaked = false;
		newUserPoolStake.unstakedAt = BigInt.zero();
		newUserPoolStake.save();
	}
}

export function handleStaked(event: Staked): void {
	const memberAddress = event.params.staker;
	const member = Member.load(memberAddress);
	const amount = event.params.amount;

	if (!member) {
		throw new Error("Member does not exist");
	}

	const conditions = getOrCreateConditions();
	// update member's staking
	member.staking = member.staking.plus(amount);
	member.save();
	const invite = checkInviteCondition(memberAddress, conditions);
	const matching = checkMatchingCondition(memberAddress, conditions);
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
			parentBinaryData.volumeLeft = parentBinaryData.volumeLeft.plus(amount);
			parentBinaryData.matchedLeft = parentBinaryData.matchedLeft.plus(amount);
			// biome-ignore lint/style/noNonNullAssertion: not supported
		} else if (parent.right && parent.right!.equals(current.member)) {
			parentBinaryData.stakingRight = parentBinaryData.stakingRight.plus(amount);
			parentBinaryData.volumeRight = parentBinaryData.volumeRight.plus(amount);
			parentBinaryData.matchedRight = parentBinaryData.matchedRight.plus(amount);
		} else {
			// should not happen
			throw new Error("Member does not belong to parent");
		}

		const currentMatchedLeft = parentBinaryData.stakingLeft.plus(parentBinaryData.bettingLeft.div(BigInt.fromI64(100)));
		const currentMatchedRight = parentBinaryData.stakingRight.plus(parentBinaryData.bettingRight.div(BigInt.fromI64(100)));

		const calcualtedMatchedLeft = parentBinaryData.matchedLeft;
		const calcualtedMatchedRight = parentBinaryData.matchedRight;

		parentBinaryData.totalMatchedVolume = calcualtedMatchedLeft.plus(calcualtedMatchedRight);
		parentBinaryData.matchedWeak = calcualtedMatchedLeft.lt(calcualtedMatchedRight) ? calcualtedMatchedLeft : calcualtedMatchedRight;
		parentBinaryData.matchedStrong = calcualtedMatchedLeft.gt(calcualtedMatchedRight) ? calcualtedMatchedLeft : calcualtedMatchedRight;

		// matched is minimum of matchedLeft and matchedRight
		parentBinaryData.totalMatched = calcualtedMatchedLeft.lt(calcualtedMatchedRight) ? calcualtedMatchedLeft : calcualtedMatchedRight;

		parentBinaryData.totalVolume = currentMatchedLeft.plus(currentMatchedRight);
		parentBinaryData.weakVolume = currentMatchedLeft.ge(currentMatchedRight) ? currentMatchedRight : currentMatchedLeft;
		parentBinaryData.strongVolume = currentMatchedRight.gt(currentMatchedLeft) ? currentMatchedRight : currentMatchedLeft;
		parentBinaryData.save();

		parent.isMatching = checkMatchingCondition(Address.fromBytes(parentAddress), conditions);
		parent.isInviting = checkInviteCondition(Address.fromBytes(parentAddress), conditions);
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
		inviterLinearData.stakingLinear = inviterLinearData.stakingLinear.plus(amount);
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
	inviterLinearData.stakingDirect = inviterLinearData.stakingDirect.plus(amount);
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
	log.info("handleBet: binding BetInterface at address {}", [event.params.bet.toHexString()]);
	const betInfo = BetInterface.bind(event.params.bet).getBetInfo();
	const amount = betInfo.value2;
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
			parentBinaryData.volumeLeft = parentBinaryData.volumeLeft.plus(amount.div(BigInt.fromI64(100)));
			parentBinaryData.bettingLeft = parentBinaryData.bettingLeft.plus(amount);
			parentBinaryData.matchedLeft = parentBinaryData.matchedLeft.plus(amount.div(BigInt.fromI64(100)));
			// biome-ignore lint/style/noNonNullAssertion: not supported
		} else if (parent.right && parent.right!.equals(current.member)) {
			parentBinaryData.volumeRight = parentBinaryData.volumeRight.plus(amount.div(BigInt.fromI64(100)));
			parentBinaryData.bettingRight = parentBinaryData.bettingRight.plus(amount);
			parentBinaryData.matchedRight = parentBinaryData.matchedRight.plus(amount.div(BigInt.fromI64(100)));
		} else {
			// should not happen
			throw new Error("Member does not belong to parent");
		}
		const currentMatchedLeft = parentBinaryData.stakingLeft.plus(parentBinaryData.bettingLeft.div(BigInt.fromI64(100)));
		const currentMatchedRight = parentBinaryData.stakingRight.plus(parentBinaryData.bettingRight.div(BigInt.fromI64(100)));
		const calcualtedMatchedLeft = parentBinaryData.matchedLeft;
		const calcualtedMatchedRight = parentBinaryData.matchedRight;

		parentBinaryData.totalMatchedVolume = calcualtedMatchedLeft.plus(calcualtedMatchedRight);
		parentBinaryData.matchedWeak = calcualtedMatchedLeft.lt(calcualtedMatchedRight) ? calcualtedMatchedLeft : calcualtedMatchedRight;
		parentBinaryData.matchedStrong = calcualtedMatchedLeft.gt(calcualtedMatchedRight) ? calcualtedMatchedLeft : calcualtedMatchedRight;
		// matched is minimum of matchedLeft and matchedRight
		parentBinaryData.totalMatched = calcualtedMatchedLeft.lt(calcualtedMatchedRight) ? calcualtedMatchedLeft : calcualtedMatchedRight;
		parentBinaryData.weakVolume = currentMatchedLeft.ge(currentMatchedRight) ? currentMatchedRight : currentMatchedLeft;
		parentBinaryData.strongVolume = currentMatchedRight.gt(currentMatchedLeft) ? currentMatchedRight : currentMatchedLeft;
		parentBinaryData.totalVolume = currentMatchedLeft.plus(currentMatchedRight);
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
		inviterLinearData.bettingLinear = inviterLinearData.bettingLinear.plus(amount);
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
	inviterLinearData.bettingDirect = inviterLinearData.bettingDirect.plus(amount);
	inviterLinearData.save();
}

export function handleBonus(event: NewMatchingBonus): void {
	const member = Member.load(event.params.member);
	if (!member) {
		throw new Error("Member does not exist");
	}
	member.bonus = event.params.amount;
	member.lastUpdatedBonus = event.block.timestamp;
	member.save();
}

export function handleDynamicWithdraw(event: DynamicWithdraw): void {
	const pool = event.params.pool;
	const stakersCount = DynamicStakingPool.bind(event.params.pool).getStakersCount();
	for (let i = 0; i < stakersCount.toI32(); i++) {
		const staker = DynamicStakingPool.bind(event.params.pool).stakers(BigInt.fromI32(i));
		handleWithdraw(pool, event.block.timestamp, staker);
	}
}

export function handleConservativeWithdraw(event: Withdraw): void {
	const receipt = event.receipt;

	const transferSignature = Bytes.fromHexString("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"); // signature of ERC20 transfer event
	let pool: Address | null = null;
	if (receipt) {
		const txLogs = receipt.logs;

		for (let i = 0; i < txLogs.length; i++) {
			const txLog = txLogs[i];

			if (txLog.topics[0].equals(transferSignature)) {
				const fromTopic = txLog.topics[1];
				const from = `0x${fromTopic.toHexString().slice(-40)}`; // Get the last 40 characters(Address)
				pool = Address.fromString(from);
				break;
			}
		}
	}

	if (pool) {
		const staker = event.params.staker;
		handleWithdraw(pool, event.block.timestamp, staker);
	}
}

export function handleWithdraw(pool: Address, timestamp: BigInt, staker: Address): void {
	log.info("handleWithdraw: {}, {}, {}", [pool.toHexString(), timestamp.toString(), staker.toHexString()]);
	const userPoolStake = UserPoolStake.load(getUserPoolStakeId(staker, pool));
	if (!userPoolStake) {
		throw new Error("UserPoolStake does not exist");
	}

	const amount = userPoolStake.amount;

	userPoolStake.amount = BigInt.zero();
	userPoolStake.unstaked = true;
	userPoolStake.unstakedAt = timestamp;
	userPoolStake.save();

	const memberAddress = staker;
	const member = Member.load(memberAddress);
	if (!member) {
		throw new Error("Member does not exist");
	}

	const conditions = getOrCreateConditions();
	if (!conditions) {
		throw new Error("Conditions does not exist");
	}

	member.staking = member.staking.minus(amount);
	member.save();
	const invite = checkInviteCondition(memberAddress, conditions);
	const matching = checkMatchingCondition(memberAddress, conditions);
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
			parentBinaryData.stakingLeft = parentBinaryData.stakingLeft.minus(amount);
			parentBinaryData.volumeLeft = parentBinaryData.volumeLeft.minus(amount);

			let matchedLeft = parentBinaryData.matchedLeft.minus(amount);

			if (matchedLeft.lt(parentBinaryData.totalMatched)) {
				matchedLeft = parentBinaryData.totalMatched;
			}
			parentBinaryData.matchedLeft = matchedLeft;
			// biome-ignore lint/style/noNonNullAssertion: not supported
		} else if (parent.right && parent.right!.equals(current.member)) {
			parentBinaryData.stakingRight = parentBinaryData.stakingRight.minus(amount);
			parentBinaryData.volumeRight = parentBinaryData.volumeRight.minus(amount);

			let matchedRight = parentBinaryData.matchedRight.minus(amount);
			if (matchedRight.lt(parentBinaryData.totalMatched)) {
				matchedRight = parentBinaryData.totalMatched;
			}
			parentBinaryData.matchedRight = matchedRight;
		} else {
			// should not happen
			throw new Error("Member does not belong to parent");
		}

		const currentMatchedLeft = parentBinaryData.stakingLeft.plus(parentBinaryData.bettingLeft.div(BigInt.fromI64(100)));
		const currentMatchedRight = parentBinaryData.stakingRight.plus(parentBinaryData.bettingRight.div(BigInt.fromI64(100)));

		const calculatedMatchedRight = parentBinaryData.matchedRight;
		const calculatedMatchedLeft = parentBinaryData.matchedLeft;

		parentBinaryData.totalMatchedVolume = calculatedMatchedRight.plus(calculatedMatchedLeft);

		parentBinaryData.matchedWeak = calculatedMatchedRight.lt(calculatedMatchedLeft) ? calculatedMatchedRight : calculatedMatchedLeft;
		parentBinaryData.matchedStrong = calculatedMatchedRight.gt(calculatedMatchedLeft) ? calculatedMatchedRight : calculatedMatchedLeft;

		parentBinaryData.totalVolume = currentMatchedLeft.plus(currentMatchedRight);
		parentBinaryData.weakVolume = currentMatchedLeft.ge(currentMatchedRight) ? currentMatchedRight : currentMatchedLeft;
		parentBinaryData.strongVolume = currentMatchedRight.gt(currentMatchedLeft) ? currentMatchedRight : currentMatchedLeft;

		parentBinaryData.save();

		parent.isMatching = checkMatchingCondition(Address.fromBytes(parentAddress), conditions);
		parent.isInviting = checkInviteCondition(Address.fromBytes(parentAddress), conditions);

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
		inviterLinearData.stakingLinear = inviterLinearData.stakingLinear.plus(amount);
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
	inviterLinearData.stakingDirect = inviterLinearData.stakingDirect.plus(amount);
	inviterLinearData.save();
}

export function handleNewInviteStakingCondition(event: NewInviteStakingCondition): void {
	const conditions = getOrCreateConditions();
	conditions.inviteCondition = event.params.value;
	conditions.inviteConditionLastUpdated = event.block.timestamp;
	conditions.save();
}

export function handleNewMatchingStakingCondition(event: NewMatchingStakingCondition): void {
	const conditions = getOrCreateConditions();
	conditions.matchingCondition = event.params.value;
	conditions.matchingConditionLastUpdated = event.block.timestamp;
	conditions.save();
}

export function handleNewMatchingInviteeCondition(event: NewMatchingInviteeCondition): void {
	const conditions = getOrCreateConditions();
	conditions.matchingInviteeCondition = event.params.value;
	conditions.matchingInviteeConditionLastUpdated = event.block.timestamp;
	conditions.save();
}

export function getOrCreateConditions(): Conditions {
	const conditions = Conditions.load(Bytes.fromUTF8("1"));
	if (!conditions) {
		throw new Error("Conditions does not exist");
	}
	return conditions;
}

// user must have staked at least inviteCondition or have at least one directly invited user
export function checkInviteCondition(memberAddress: Address, conditions: Conditions): boolean {
	const member = Member.load(memberAddress);
	if (!member) {
		throw new Error("Member does not exist");
	}
	const linearData = LinearData.load(memberAddress);
	if (!linearData) {
		throw new Error("LinearData does not exist");
	}
	return member.staking.ge(conditions.inviteCondition) || linearData.directCount > 0;
}

// user must have staked at least matchingCondition and have at least 2 direct users who staked at least matchingInviteeCondition
export function checkMatchingCondition(memberAddress: Address, conditions: Conditions): boolean {
	const member = Member.load(memberAddress);
	if (!member) {
		throw new Error("Member does not exist");
	}
	if (member.staking.lt(conditions.matchingCondition)) {
		return false;
	}
	const linearData = LinearData.load(memberAddress);
	if (!linearData) {
		throw new Error("LinearData does not exist");
	}
	if (linearData.directCount < 2) {
		return false;
	}
	let count = 0;
	const invitees = member.invitees.load();
	for (let i = 0; i < invitees.length; i++) {
		const invitee = invitees[i];
		if (invitee.staking.ge(conditions.matchingInviteeCondition)) {
			count = count + 1;
		}
		if (count >= 2) {
			return true;
		}
	}
	return false;
}
