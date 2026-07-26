import {
  ChainCallDTO,
  GalaChainContext,
  Identifiable,
  Immutable,
  TokenBalance,
  TokenClass,
  TokenInstance,
  TokenInstanceKey,
  createValidEntityState,
  getCurrentDate,
  getObjectFromBytes,
  getObjectId,
  stringify,
  toDateTimestamp
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { Args, Return } from "@gala-chain/api";

export interface IKleeblattCoin extends Identifiable {
  readonly key: string;
  readonly tokenClass: TokenClass;
  readonly owner: string;
  readonly balance: BigNumber;
  readonly createdAt: number;
  readonly claimableUntil?: number;
}

export class KleeblattCoin extends Immutable<IKleeblattCoin> implements Identifiable {
  public get key(): string {
    return getObjectId(KleeblattCoin, {
      tokenClass: this.tokenClass,
      owner: this.owner
    });
  }

  public static create(
    tokenClass: TokenClass,
    owner: string,
    balance: BigNumber,
    createdAt?: number,
    claimableUntil?: number
  ): KleeblattCoin {
    return new KleeblattCoin({
      tokenClass,
      owner,
      balance,
      createdAt: createdAt ?? getCurrentDate(),
      claimableUntil
    });
  }

  public static fromJson(data: unknown): KleeblattCoin {
    return getObjectFromBytes<KleeblattCoin>(KleeblattCoin, data);
  }
}

export class CreateKleeblattCoinDto extends ChainCallDTO {
  @Args()
  public tokenClass!: TokenClass;

  @Args()
  public owner!: string;

  @Args()
  public quantity!: number;
}

export class GetKleeblattCoinBalanceDto extends ChainCallDTO {
  @Args()
  public tokenClass!: TokenClass;

  @Args()
  public owner!: string;
}

export class MintKleeblattCoinDto extends ChainCallDTO {
  @Args()
  public tokenClass!: TokenClass;

  @Args()
  public owner!: string;

  @Args()
  public quantity!: number;
}

export class KleeblattCoinContract extends TokenInstance {
  public async createKleeblattCoin(
    ctx: GalaChainContext,
    dto: CreateKleeblattCoinDto
  ): Promise<Return<TokenInstanceKey>> {
    const { tokenClass, owner, quantity } = dto;

    const newToken = KleeblattCoin.create(
      tokenClass,
      owner,
      new BigNumber(quantity)
    );

    const key = newToken.key;
    const data = createValidEntityState(ctx.stub, newToken);

    await ctx.stub.putState(key, stringify(data));

    return newToken;
  }

  public async getKleeblattCoinBalance(
    ctx: GalaChainContext,
    dto: GetKleeblattCoinBalanceDto
  ): Promise<TokenBalance[]> {
    const { tokenClass, owner } = dto;

    return await TokenBalance.getBalance(ctx, tokenClass, owner);
  }

  public async mintKleeblattCoin(
    ctx: GalaChainContext,
    dto: MintKleeblattCoinDto
  ): Promise<TokenInstance[]> {
    const { tokenClass, owner, quantity } = dto;

    return await TokenInstance.mintToken(ctx, {
      tokenClass,
      owner,
      quantity: new BigNumber(quantity),
      effectiveDate: toDateTimestamp(getCurrentDate())
    });
  }
}