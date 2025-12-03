/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: shadowing */
/** biome-ignore-all lint/style/useImportType: not supported */
import { BigInt, Bytes, DataSourceContext, ethereum } from "@graphprotocol/graph-ts";
import { afterEach, assert, beforeAll, clearStore, dataSourceMock, describe, test } from "matchstick-as";
import { handleConservativeStaked, handleConservativeWithdraw, handleOnce } from "../../src/pass";
import { getAddress } from "../../src/utils/ids";
import { ETHER } from "../../src/utils/numbers";
import { BASE_TIMESTAMP, ONE_DAY } from "../../src/utils/time";
import { affiliateAddress, conservativeStakingAddress, dynamicStakingAddress } from "../contstants";
import { createBaseTree } from "../utils/mock-trees";
import {
	createMockedFunctionAffiliate_inviteStakingCondition,
	createMockedFunctionAffiliate_matchingInviteeCondition,
	createMockedFunctionAffiliate_matchingStakingCondition,
} from "../utils/mocked-functions";
import { preparePool } from "./binary-withdraw-utils";
import { stakedEvent, withdrawConservativeEvent } from "./mock-events";
import { Ether } from "./pass-utils";

const pool_1 = getAddress(10_000);
const pool_2 = getAddress(10_001);
const pool_3 = getAddress(10_002);
const pool_4 = getAddress(10_003);
const pool_5 = getAddress(10_004);
const pool_6 = getAddress(10_005);
const pool_7 = getAddress(10_006);
const pool_8 = getAddress(10_007);
const pool_9 = getAddress(10_008);
const pool_10 = getAddress(10_009);

const metaContext = new DataSourceContext();
metaContext.setBytes("dynamicStaking", dynamicStakingAddress);
metaContext.setBytes("conservativeStaking", conservativeStakingAddress);
metaContext.setBytes("affiliate", affiliateAddress);
metaContext.setI32("exception", 0);

dataSourceMock.setContext(metaContext);

describe("Binary, user unstaking", () => {
	beforeAll(() => {
		createMockedFunctionAffiliate_inviteStakingCondition(affiliateAddress, new BigInt(500000).times(ETHER));
		createMockedFunctionAffiliate_matchingStakingCondition(affiliateAddress, new BigInt(1000000).times(ETHER));
		createMockedFunctionAffiliate_matchingInviteeCondition(affiliateAddress, new BigInt(1000000).times(ETHER));
		const block = new ethereum.Block(
			Bytes.fromI32(0),
			Bytes.fromI32(0),
			Bytes.fromI32(0),
			getAddress(0),
			Bytes.fromI32(0),
			Bytes.fromI32(0),
			Bytes.fromI32(0),
			new BigInt(0),
			new BigInt(0),
			new BigInt(0),
			new BigInt(0),
			new BigInt(0),
			new BigInt(0),
			new BigInt(0),
			new BigInt(0),
		);
		handleOnce(block);
	});
	afterEach(() => {
		clearStore();
	});
	test("Binary withdraw", () => {
		const BASE_PLUS_ONE_MONTH = BASE_TIMESTAMP.plus(ONE_DAY.times(BigInt.fromI32(30)));
		const addresses = createBaseTree();
		const root = addresses[0];
		const user_1_left = addresses[1];
		const user_2_right = addresses[2];

		// user 1 stake 50

		preparePool(pool_1);
		let stakeUser_1 = stakedEvent(user_1_left, Ether.getWeiBigInt(BigInt.fromI32(50)));
		stakeUser_1.block.timestamp = BASE_PLUS_ONE_MONTH;
		handleConservativeStaked(stakeUser_1);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(0)));
		assert.fieldEquals("BinaryData", root.toHexString(), "volumeLeft", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "volumeRight", Ether.getWeiString(BigInt.fromI32(0)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(0)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(0)));

		// user 2 stake 50

		preparePool(pool_2);
		let stakeUser_2 = stakedEvent(user_2_right, Ether.getWeiBigInt(BigInt.fromI32(50)));
		stakeUser_2.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY);
		handleConservativeStaked(stakeUser_2);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(50)));

		// user 2 stake 50
		preparePool(pool_3);

		stakeUser_2 = stakedEvent(user_2_right, Ether.getWeiBigInt(BigInt.fromI32(50)));
		stakeUser_2.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY);
		handleConservativeStaked(stakeUser_2);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(150)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(150)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "volumeLeft", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "volumeRight", Ether.getWeiString(BigInt.fromI32(100)));

		// user 1 stake 50

		preparePool(pool_4);
		stakeUser_1 = stakedEvent(user_1_left, Ether.getWeiBigInt(BigInt.fromI32(50)));
		stakeUser_1.block.timestamp = BASE_PLUS_ONE_MONTH;
		handleConservativeStaked(stakeUser_1);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "volumeLeft", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "volumeRight", Ether.getWeiString(BigInt.fromI32(100)));

		// user 2 stake 100

		preparePool(pool_5);
		stakeUser_2 = stakedEvent(user_2_right, Ether.getWeiBigInt(BigInt.fromI32(100)));
		stakeUser_2.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY);
		handleConservativeStaked(stakeUser_2);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(200)));

		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(300)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(300)));

		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(200)));

		assert.fieldEquals("BinaryData", root.toHexString(), "volumeLeft", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "volumeRight", Ether.getWeiString(BigInt.fromI32(200)));

		// user 1 withdraw 50

		let withdrawUser_1 = withdrawConservativeEvent(pool_4, user_1_left);

		withdrawUser_1.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY.times(BigInt.fromI32(14)));

		handleConservativeWithdraw(withdrawUser_1);

		assert.fieldEquals("BinaryData", root.toHexString(), "volumeLeft", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "volumeRight", Ether.getWeiString(BigInt.fromI32(200)));

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(50)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(200)));

		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(250)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(300)));

		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(200)));

		preparePool(pool_6);
		stakeUser_1 = stakedEvent(user_1_left, Ether.getWeiBigInt(BigInt.fromI32(50)));
		stakeUser_1.block.timestamp = BASE_PLUS_ONE_MONTH;
		handleConservativeStaked(stakeUser_1);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(300)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(150)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(350)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(150)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(200)));

		//- 100 right
		const withdrawUser_2 = withdrawConservativeEvent(pool_5, user_2_right);

		withdrawUser_2.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY.times(BigInt.fromI32(14)));

		handleConservativeWithdraw(withdrawUser_2);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(150)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(300)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(150)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(150)));

		preparePool(pool_7);
		stakeUser_2 = stakedEvent(user_2_right, Ether.getWeiBigInt(BigInt.fromI32(100)));
		stakeUser_2.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY);
		handleConservativeStaked(stakeUser_2);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(300)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(150)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(400)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(150)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(250)));

		preparePool(pool_8);
		stakeUser_1 = stakedEvent(user_1_left, Ether.getWeiBigInt(BigInt.fromI32(200)));
		stakeUser_1.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY);
		handleConservativeStaked(stakeUser_1);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(300)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(500)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(250)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(600)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(350)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(250)));

		//- 200 left
		withdrawUser_1 = withdrawConservativeEvent(pool_8, user_1_left);

		withdrawUser_1.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY.times(BigInt.fromI32(14)));

		handleConservativeWithdraw(withdrawUser_1);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(100)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(300)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(250)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(500)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(250)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(250)));

		preparePool(pool_9);
		stakeUser_1 = stakedEvent(user_1_left, Ether.getWeiBigInt(BigInt.fromI32(100)));
		stakeUser_1.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY);
		handleConservativeStaked(stakeUser_1);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(400)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(250)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(600)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(350)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(250)));

		preparePool(pool_10);
		stakeUser_2 = stakedEvent(user_2_right, Ether.getWeiBigInt(BigInt.fromI32(100)));
		stakeUser_2.block.timestamp = BASE_PLUS_ONE_MONTH.plus(ONE_DAY);
		handleConservativeStaked(stakeUser_2);

		assert.fieldEquals("BinaryData", root.toHexString(), "weakVolume", Ether.getWeiString(BigInt.fromI32(200)));
		assert.fieldEquals("BinaryData", root.toHexString(), "strongVolume", Ether.getWeiString(BigInt.fromI32(300)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalVolume", Ether.getWeiString(BigInt.fromI32(500)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatched", Ether.getWeiString(BigInt.fromI32(350)));
		assert.fieldEquals("BinaryData", root.toHexString(), "totalMatchedVolume", Ether.getWeiString(BigInt.fromI32(700)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedLeft", Ether.getWeiString(BigInt.fromI32(350)));
		assert.fieldEquals("BinaryData", root.toHexString(), "matchedRight", Ether.getWeiString(BigInt.fromI32(350)));
	});
});
