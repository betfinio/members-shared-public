/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: todo */
import { BigInt } from "@graphprotocol/graph-ts";

export const ETHER = BigInt.fromI32(10).pow(18);
export const TEN_ETHER = ETHER.times(BigInt.fromI32(10));
