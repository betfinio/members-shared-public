/** biome-ignore-all lint/style/useImportType: not supported */
/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: shadowing */
import { Address, Bytes } from "@graphprotocol/graph-ts";

export const getUserPoolStakeId = (member: Address, pool: Address): Bytes => {
	return member.concat(pool);
};

export function getAddress(num: number): Address {
	// Create hex addresses with format: 0x000..000{num}
	const str = num.toString().split(".")[0];
	return Address.fromString(
		"0x".concat("0".repeat(40 - str.length)).concat(str),
	);
}
