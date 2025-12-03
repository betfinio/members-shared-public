/** biome-ignore-all lint/style/useImportType: not supported */
/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: shadowing */
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BASE_TIMESTAMP, ONE_WEEK } from "../../src/utils/time";
import { conservativeStakingAddress } from "../contstants";
import {
	createMockedFunctionConservativeStaking_currentPool,
	createMockedFunctionConservativeStaking_getActivePoolCount,
	createMockedFunctionConservativeStaking_totalStaked,
	createMockedFunctionConservativeStakingPool_duration,
	createMockedFunctionConservativeStakingPool_start,
} from "../utils/mocked-functions";

export function preparePool(pool: Address): void {
	createMockedFunctionConservativeStaking_getActivePoolCount(conservativeStakingAddress, BigInt.fromI32(1));
	createMockedFunctionConservativeStakingPool_start(pool, BASE_TIMESTAMP);
	createMockedFunctionConservativeStakingPool_duration(pool, ONE_WEEK.times(BigInt.fromI32(80)));
	createMockedFunctionConservativeStaking_totalStaked(pool, BigInt.fromI32(0));
	createMockedFunctionConservativeStaking_currentPool(conservativeStakingAddress, pool);
}
