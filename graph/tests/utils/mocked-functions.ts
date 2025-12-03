/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: shadowing */
/** biome-ignore-all lint/style/useImportType: not supported */

import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { createMockedFunction } from "matchstick-as";
import { affiliateAddress } from "../contstants";

export const createMockedFunctionAffiliate_checkInviteCondition = (address: Address, returnValue: boolean): void => {
	createMockedFunction(affiliateAddress, "checkInviteCondition", "checkInviteCondition(address):(bool)")
		.withArgs([ethereum.Value.fromAddress(address)])
		.returns([ethereum.Value.fromBoolean(returnValue)]);
};

export const createMockedFunctionAffiliate_checkMatchingCondition = (address: Address, returnValue: boolean): void => {
	createMockedFunction(affiliateAddress, "checkMatchingCondition", "checkMatchingCondition(address):(bool)")
		.withArgs([ethereum.Value.fromAddress(address)])
		.returns([ethereum.Value.fromBoolean(returnValue)]);
};

export const createMockedFunction_BetInterface_getAmount = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "getAmount", "getAmount():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};

export const createMockedFunctionConservativeStaking_currentPool = (address: Address, returnValue: Address): void => {
	createMockedFunction(address, "currentPool", "currentPool():(address)")
		.withArgs([])
		.returns([ethereum.Value.fromAddress(returnValue)]);
};
export const createMockedFunctionConservativeStaking_getActivePoolCount = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "getActivePoolCount", "getActivePoolCount():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};

export const createMockedFunctionAffiliate_inviteStakingCondition = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "inviteStakingCondition", "inviteStakingCondition():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};

export const createMockedFunctionAffiliate_matchingStakingCondition = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "matchingStakingCondition", "matchingStakingCondition():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};

export const createMockedFunctionAffiliate_matchingInviteeCondition = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "matchingInviteeCondition", "matchingInviteeCondition():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};

export const createMockedFunctionConservativeStaking_pools = (address: Address, returnValue: Address, index: BigInt): void => {
	createMockedFunction(address, "pools", "pools(uint256):(address)")
		.withArgs([ethereum.Value.fromUnsignedBigInt(index)])
		.returns([ethereum.Value.fromAddress(returnValue)]);
};
export const createMockedFunctionConservativeStaking_totalStaked = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "totalStaked", "totalStaked():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};

export const createMockedFunctionDynamicStaking_currentPool = (address: Address, returnValue: Address): void => {
	createMockedFunction(address, "currentPool", "currentPool():(address)")
		.withArgs([])
		.returns([ethereum.Value.fromAddress(returnValue)]);
};

export const createMockedFunctionDynamicStaking_getStakersCount = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "getStakersCount", "getStakersCount():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};

export const createMockedFunctionDynamicStaking_stakers = (address: Address, returnValue: Address, index: BigInt): void => {
	createMockedFunction(address, "stakers", "stakers(uint256):(address)")
		.withArgs([ethereum.Value.fromUnsignedBigInt(index)])
		.returns([ethereum.Value.fromAddress(returnValue)]);
};

export const createMockedFunctionConservativeStakingPool_start = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "start", "start():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};
export const createMockedFunctionConservativeStakingPool_duration = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "duration", "duration():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};

export const createMockedFunctionDynamicStakingPool_endCycle = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "endCycle", "endCycle():(uint256)")
		.withArgs([])
		.returns([ethereum.Value.fromUnsignedBigInt(returnValue)]);
};

export const createMockedFunctionBetInterface_getBetInfo = (address: Address, returnValue: BigInt): void => {
	createMockedFunction(address, "getBetInfo", "getBetInfo():(address,address,uint256,uint256,uint256,uint256)")
		.withArgs([])
		.returns([
			ethereum.Value.fromAddress(address),
			ethereum.Value.fromAddress(address),
			ethereum.Value.fromUnsignedBigInt(returnValue),
			ethereum.Value.fromUnsignedBigInt(returnValue),
			ethereum.Value.fromUnsignedBigInt(returnValue),
			ethereum.Value.fromUnsignedBigInt(returnValue),
		]);
};
