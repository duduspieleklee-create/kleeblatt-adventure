"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KleeblattCoinContract = exports.MintKleeblattCoinDto = exports.GetKleeblattCoinBalanceDto = exports.CreateKleeblattCoinDto = void 0;
const api_1 = require("@gala-chain/api");
const chaincode_1 = require("@gala-chain/chaincode");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer"); // Added the class-transformer utility decorator
/**
 * DTO for creating a new KleeblattCoin token class.
 */
class CreateKleeblattCoinDto extends api_1.SubmitCallDTO {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKleeblattCoinDto.prototype, "collection", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKleeblattCoinDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKleeblattCoinDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKleeblattCoinDto.prototype, "additionalKey", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateKleeblattCoinDto.prototype, "decimals", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKleeblattCoinDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKleeblattCoinDto.prototype, "symbol", void 0);
exports.CreateKleeblattCoinDto = CreateKleeblattCoinDto;
/**
 * DTO for checking KleeblattCoin balance.
 */
class GetKleeblattCoinBalanceDto extends api_1.ChainCallDTO {
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => api_1.TokenClassKey) // Replaced ObjectProperty with Type metadata mapper
    ,
    __metadata("design:type", api_1.TokenClassKey)
], GetKleeblattCoinBalanceDto.prototype, "tokenClass", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetKleeblattCoinBalanceDto.prototype, "owner", void 0);
exports.GetKleeblattCoinBalanceDto = GetKleeblattCoinBalanceDto;
/**
 * DTO for minting KleeblattCoins.
 */
class MintKleeblattCoinDto extends api_1.SubmitCallDTO {
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => api_1.TokenClassKey) // Replaced ObjectProperty with Type metadata mapper
    ,
    __metadata("design:type", api_1.TokenClassKey)
], MintKleeblattCoinDto.prototype, "tokenClass", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MintKleeblattCoinDto.prototype, "owner", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MintKleeblattCoinDto.prototype, "quantity", void 0);
exports.MintKleeblattCoinDto = MintKleeblattCoinDto;
/**
 * KleeblattCoinContract — GalaChain Token Contract
 */
class KleeblattCoinContract extends chaincode_1.GalaContract {
    constructor() {
        super("KleeblattCoinContract", "1.0.0");
    }
    /**
     * Create a new KleeblattCoin token class on chain.
     */
    async CreateKleeblattCoin(ctx, dto) {
        return dto;
    }
    /**
     * Get the KleeblattCoin balance for a given owner.
     */
    async GetKleeblattCoinBalance(ctx, dto) {
        return dto;
    }
    /**
     * Mint KleeblattCoins for a given owner.
     */
    async MintKleeblattCoin(ctx, dto) {
        return dto;
    }
}
__decorate([
    (0, chaincode_1.GalaTransaction)({
        in: CreateKleeblattCoinDto,
        out: CreateKleeblattCoinDto,
        type: chaincode_1.GalaTransactionType.SUBMIT,
        verifySignature: true,
        enforceUniqueKey: true
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chaincode_1.GalaChainContext,
        CreateKleeblattCoinDto]),
    __metadata("design:returntype", Promise)
], KleeblattCoinContract.prototype, "CreateKleeblattCoin", null);
__decorate([
    (0, chaincode_1.UnsignedEvaluate)({
        in: GetKleeblattCoinBalanceDto,
        out: GetKleeblattCoinBalanceDto
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chaincode_1.GalaChainContext,
        GetKleeblattCoinBalanceDto]),
    __metadata("design:returntype", Promise)
], KleeblattCoinContract.prototype, "GetKleeblattCoinBalance", null);
__decorate([
    (0, chaincode_1.GalaTransaction)({
        in: MintKleeblattCoinDto,
        out: MintKleeblattCoinDto,
        type: chaincode_1.GalaTransactionType.SUBMIT,
        verifySignature: true,
        enforceUniqueKey: true
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chaincode_1.GalaChainContext,
        MintKleeblattCoinDto]),
    __metadata("design:returntype", Promise)
], KleeblattCoinContract.prototype, "MintKleeblattCoin", null);
exports.KleeblattCoinContract = KleeblattCoinContract;
//# sourceMappingURL=KleeblattCoinContract.js.map