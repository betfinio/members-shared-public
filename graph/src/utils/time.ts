import { BigInt } from "@graphprotocol/graph-ts";

export const NEW_YEAR_2025_TIMESTAMP = BigInt.fromI32(1735689600);

export const SOME_DATE = BigInt.fromI32(1749732027);

export const ONE_DAY = BigInt.fromI32(86400);
export const ONE_WEEK = ONE_DAY.times(BigInt.fromI32(7));
export const FOUR_WEEKS = ONE_WEEK.times(BigInt.fromI32(4));
export const TWELVE_WEEKS = FOUR_WEEKS.times(BigInt.fromI32(3));
export const FIVE_MINUTES = BigInt.fromI32(300);

// Base timestamp: January 1, 2024 00:00:00 UTC
export const BASE_TIMESTAMP = BigInt.fromI32(1704067200);

export function getStartOfDay(timestamp: BigInt): BigInt {
	const secondsSinceMidnight = timestamp.mod(ONE_DAY);
	return timestamp.minus(secondsSinceMidnight);
}

export function shouldResetDiff(
	lastUpdateTime: BigInt,
	currentTime: BigInt,
	interval: BigInt,
): boolean {
	// For daily reset, just check if we crossed midnight
	if (interval.equals(ONE_DAY)) {
		return !getStartOfDay(lastUpdateTime).equals(getStartOfDay(currentTime));
	}

	// For weekly/monthly:
	// 1. Calculate how many complete intervals have passed since BASE_TIMESTAMP for both times
	const lastUpdateStartOfDay = getStartOfDay(lastUpdateTime);
	const currentStartOfDay = getStartOfDay(currentTime);

	const lastUpdateIntervals = lastUpdateStartOfDay
		.minus(BASE_TIMESTAMP)
		.div(interval);
	const currentIntervals = currentStartOfDay
		.minus(BASE_TIMESTAMP)
		.div(interval);

	// Reset if we're in a different interval number
	return !lastUpdateIntervals.equals(currentIntervals);
}
