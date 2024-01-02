import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode, TupleItemSlice
} from 'ton-core';

export type Task2Config = {
    admin_address: Address,
    users: Map<Address, number>,
    total: number,
};

export function task2ConfigToCell(config: Task2Config): Cell {
    const userShares = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Uint(32));
    config.users.forEach((v, key) => {
        userShares.set(key.hash, v);
    });
    return beginCell()
      .storeAddress(config.admin_address)
      .storeDict(userShares, Dictionary.Keys.Buffer(32), Dictionary.Values.Uint(32))
      .storeUint(config.total, 32)
      .endCell();
}

export class Task2 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task2(address);
    }

    static createFromConfig(config: Task2Config, code: Cell, workchain = 0) {
        const data = task2ConfigToCell(config);
        const init = { code, data };
        return new Task2(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async send(provider: ContractProvider, via: Sender, value: bigint, body: Cell) {
        await provider.internal(via, {
            value,
            body,
        });
    }

    async getAddressShares(provider: ContractProvider): Promise<Dictionary<Buffer, number>> {
        const result = await provider.get('get_users', []);
        return Dictionary.loadDirect(
          Dictionary.Keys.Buffer(32),
          Dictionary.Values.Uint(32),
          result.stack.readCell()
        );
    }

    async getSharesByAddress(provider: ContractProvider, address: Address): Promise<number> {
        const options: [TupleItemSlice] = [{type: 'slice', cell: beginCell().storeAddress(address).endCell()}];
        const result = await provider.get('get_user_share', options);
        return result.stack.readNumber();
    }

    async getAdminAddress(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('get_admin_address', []);
        return result.stack.readAddress();
    }
}
