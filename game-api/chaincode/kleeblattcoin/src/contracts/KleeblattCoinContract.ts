import { ChainCallDTO, SubmitCallDTO, TokenClassKey } from "@gala-chain/api";
import { GalaChainContext, GalaContract, GalaTransaction, GalaTransactionType, UnsignedEvaluate } from "@gala-chain/chaincode";
import { IsString, IsNumber, ValidateNested } from "class-validator";
import { Type } from "class-transformer"; // Added the class-transformer utility decorator

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
  @Type(() => TokenClassKey) // Replaced ObjectProperty with Type metadata mapper
  tokenClass!: TokenClassKey;

  @IsString()
  owner!: string;
}

/**
 * DTO for minting KleeblattCoins.
 */
export class MintKleeblattCoinDto extends SubmitCallDTO {
  @ValidateNested()
  @Type(() => TokenClassKey) // Replaced ObjectProperty with Type metadata mapper
  tokenClass!: TokenClassKey;

  @IsString()
  owner!: string;

  @IsNumber()
  quantity!: number;
}

/**
 * KleeblattCoinContract — GalaChain Token Contract
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
    return dto;
  }
}
