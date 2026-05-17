export interface Dealer {
    id: string;
    name: string;
    taxNumber?: string;
    phone?: string;
    address?: string;
    region?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CreateDealerDto {
    name: string;
    taxNumber?: string;
    phone?: string;
    address?: string;
    region?: string;
}
export interface UpdateDealerDto {
    name?: string;
    taxNumber?: string;
    phone?: string;
    address?: string;
    region?: string;
}
//# sourceMappingURL=dealer.d.ts.map