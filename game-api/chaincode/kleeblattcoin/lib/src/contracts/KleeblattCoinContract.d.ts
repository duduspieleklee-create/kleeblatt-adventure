import { ChainCallDTO, SubmitCallDTO, TokenClassKey } from "@gala-chain/api";
import { GalaChainContext, GalaContract } from "@gala-chain/chaincode";
/**
 * DTO for creating a new KleeblattCoin token class.
 */
export declare class CreateKleeblattCoinDto extends SubmitCallDTO {
    collection: string;
    category: string;
    type: string;
    additionalKey: string;
    decimals: number;
    name: string;
    symbol: string;
}
/**
 * DTO for checking KleeblattCoin balance.
 */
export declare class GetKleeblattCoinBalanceDto extends ChainCallDTO {
    tokenClass: TokenClassKey;
    owner: string;
}
/**
 * DTO for minting KleeblattCoins.
 */
export declare class MintKleeblattCoinDto extends SubmitCallDTO {
    tokenClass: TokenClassKey;
    owner: string;
    quantity: number;
}
/**
 * KleeblattCoinContract — GalaChain Token Contract
 */
export declare class KleeblattCoinContract extends GalaContract {
    constructor();
    /**
     * Create a new KleeblattCoin token class on chain.
     */
    CreateKleeblattCoin(ctx: GalaChainContext, dto: CreateKleeblattCoinDto): Promise<CreateKleeblattCoinDto>;
    /**
     * Get the KleeblattCoin balance for a given owner.
     */
    GetKleeblattCoinBalance(ctx: GalaChainContext, dto: GetKleeblattCoinBalanceDto): Promise<GetKleeblattCoinBalanceDto>;
    /**
     * Mint KleeblattCoins for a given owner.
     */
    MintKleeblattCoin(ctx: GalaChainContext, dto: MintKleeblattCoinDto): Promise<MintKleeblattCoinDto>;
}
//# sourceMappingURL=KleeblattCoinContract.d.ts.map