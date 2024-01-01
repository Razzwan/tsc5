import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    TupleItemCell, TupleItemSlice
} from 'ton-core';

// storage$_ public_key:uint256 execution_time:uint32 receiver:MsgAddressInt seqno:uint32 = Storage;
export type Task1Config = {
    public_key: bigint,
    execution_time: number,
    receiver: Address,
    seqno?: number,
};

export function task1ConfigToCell(config: Task1Config): Cell {
    return beginCell()
      .storeUint(config.public_key, 256)
      .storeUint(config.execution_time, 32)
      .storeAddress(config.receiver)
      .storeUint(config.seqno ?? 0, 32)
      .endCell();
}

export class Task1 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task1(address);
    }

    static createFromConfig(config: Task1Config, code: Cell, workchain = 0) {
        const data = task1ConfigToCell(config);
        const init = { code, data };
        return new Task1(contractAddress(workchain, init), init);
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

    async sendExternal(provider: ContractProvider, msg: Cell) {
        await provider.external(msg);
    }

    async getNum(provider: ContractProvider, cell: Cell): Promise<number> {
        const options: [TupleItemSlice] = [{type: 'slice', cell}];
        const result = await provider.get('get_num', options);
        return result.stack.readNumber();
    }

    async getReceiver(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('get_receiver', []);
        return result.stack.readAddress();
    }

    async getSeqno(provider: ContractProvider): Promise<number> {
        const result = await provider.get('get_seqno', []);
        return result.stack.readNumber();
    }
}
