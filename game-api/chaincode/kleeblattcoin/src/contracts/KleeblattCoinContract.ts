import { ChainCallDTO, SubmitCallDTO, TokenClassKey } from "@gala-chain/api";
import { GalaChainContext, GalaContract, GalaTransaction, GalaTransactionType, UnsignedEvaluate } from "@gala-chain/chaincode";
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
    super("KleeblattCoinContract", "1.0.0");
  }

  /**
   * Create a new KleeblattCoin token class on chain.
   */
  @GalaTransaction({
    in: CreateKleeblattCoinDto,
    out: CreateKleeblattCoinDto,
    type: GalaTransactionType.SUBMIT,
    verifySignature: true,
    enforceUniqueKey: true
  })
  public async CreateKleeblattCoin(
    ctx: GalaChainContext,
    dto: CreateKleeblattCoinDto
  ): Promise<CreateKleeblattCoinDto> {
    // Basic implementation: return the DTO as confirmation
    // In a full implementation, this would create the token class on chain
    return dto;
  }

  /**
   * Get the KleeblattCoin balance for a given owner.
   */
  @UnsignedEvaluate({
    in: GetKleeblattCoinBalanceDto,
    out: GetKleeblattCoinBalanceDto
  })
  public async GetKleeblattCoinBalance(
    ctx: GalaChainContext,
    dto: GetKleeblattCoinBalanceDto
  ): Promise<GetKleeblattCoinBalanceDto> {
    // Basic implementation: return the DTO as confirmation
    // In a full implementation, this would query the actual balance from chain
    return dto;
  }

  /**
   * Mint KleeblattCoins for a given owner.
   */
  @GalaTransaction({
    in: MintKleeblattCoinDto,
    out: MintKleeblattCoinDto,
    type: GalaTransactionType.SUBMIT,
    verifySignature: true,
    enforceUniqueKey: true
  })
  public async MintKleeblattCoin(
    ctx: GalaChainContext,
    dto: MintKleeblattCoinDto
  ): Promise<MintKleeblattCoinDto> {
    // Basic implementation: return the DTO as confirmation
    // In a full implementation, this would mint tokens on chain
    return dto;
  }
}