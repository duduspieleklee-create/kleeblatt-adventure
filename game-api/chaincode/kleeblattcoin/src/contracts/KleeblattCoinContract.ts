import { ChainCallDTO, GalaChainResponse, SubmitCallDTO, TokenClassKey, TokenBalance, TokenInstanceKey } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { GalaChainContext, GalaContract, Submit, Evaluate } from "@gala-chain/chaincode";
import { IsString, IsNumber, ValidateNested } from "class-validator";

/**
 * DTO for creating a new KleeblattCoin token class.
 */
export class CreateKleeblattCoinDto extends SubmitCallDTO {
  @IsString()
  collection!: string;

  @IsString()
  category!: string;

  @IsString()
  type!: string;

  @IsString()
  additionalKey!: string;

  @IsNumber()
  decimals!: number;

  @IsString()
  name!: string;

  @IsString()
  symbol!: string;
}

/**
 * DTO for checking KleeblattCoin balance.
 */
export class GetKleeblattCoinBalanceDto extends ChainCallDTO {
  @ValidateNested()
  tokenClass!: TokenClassKey;

  @IsString()
  owner!: string;
}

/**
 * DTO for minting KleeblattCoins.
 */
export class MintKleeblattCoinDto extends SubmitCallDTO {
  @ValidateNested()
  tokenClass!: TokenClassKey;

  @IsString()
  owner!: string;

  @IsNumber()
  quantity!: number;
}

/**
 * KleeblattCoinContract — GalaChain Token Contract
 *
 * Fungible token (KLB) awarded to top 10 daily leaderboard winners.
 * Built on GalaContract from the GalaChain SDK.
 */
export class KleeblattCoinContract extends GalaContract {
  constructor() {
    super("kleeblattcoin", "1.0.0");
  }

  /**
   * Create a new KleeblattCoin token class on chain.
   */
  @Submit({
    in: CreateKleeblattCoinDto,
    out: TokenInstanceKey
  })
  public async CreateKleeblattCoin(
    ctx: GalaChainContext,
    dto: CreateKleeblattCoinDto
  ): Promise<GalaChainResponse<TokenInstanceKey>> {
    // Basic implementation: return a success response
    // In a full implementation, this would create the token class on chain
    const tokenInstanceKey = {
      collection: dto.collection,
      category: dto.category,
      type: dto.type,
      additionalKey: dto.additionalKey,
      instance: new BigNumber(1)
    } as TokenInstanceKey;

    return GalaChainResponse.Success(tokenInstanceKey);
  }

  /**
   * Get the KleeblattCoin balance for a given owner.
   */
  @Evaluate({
    in: GetKleeblattCoinBalanceDto,
    out: TokenBalance
  })
  public async GetKleeblattCoinBalance(
    ctx: GalaChainContext,
    dto: GetKleeblattCoinBalanceDto
  ): Promise<GalaChainResponse<TokenBalance>> {
    // Basic implementation: return a zero balance
    // In a full implementation, this would query the actual balance from chain
    const balance = {
      quantity: new BigNumber(0),
      owner: dto.owner,
      collection: dto.tokenClass.collection,
      category: dto.tokenClass.category,
      type: dto.tokenClass.type,
      additionalKey: dto.tokenClass.additionalKey,
      instance: new BigNumber(0)
    } as TokenBalance;

    return GalaChainResponse.Success(balance);
  }

  /**
   * Mint KleeblattCoins for a given owner.
   */
  @Submit({
    in: MintKleeblattCoinDto,
    out: TokenInstanceKey
  })
  public async MintKleeblattCoin(
    ctx: GalaChainContext,
    dto: MintKleeblattCoinDto
  ): Promise<GalaChainResponse<TokenInstanceKey>> {
    // Basic implementation: return a success response
    // In a full implementation, this would mint tokens on chain
    const tokenInstanceKey = {
      collection: dto.tokenClass.collection,
      category: dto.tokenClass.category,
      type: dto.tokenClass.type,
      additionalKey: dto.tokenClass.additionalKey,
      instance: new BigNumber(dto.quantity)
    } as TokenInstanceKey;

    return GalaChainResponse.Success(tokenInstanceKey);
  }
}