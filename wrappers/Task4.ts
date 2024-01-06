import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    TupleItem
} from 'ton-core';
import {parseData} from '../util/parseData';

export type Task4Config = {};

export function task4ConfigToCell(config: Task4Config): Cell {
    return beginCell().endCell();
}

export class Task4 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task4(address);
    }

    static createFromConfig(config: Task4Config, code: Cell, workchain = 0) {
        const data = task4ConfigToCell(config);
        const init = { code, data };
        return new Task4(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
    async getSolve(provider: ContractProvider, maze: Array<Array<'.' | 'S' | 'E' | 'X' | '?' | '!'>>): Promise<[number, number, number, Array<Array<number>>]> {
        const n = maze.length;
        const m = maze[0].length;
        const tuple : TupleItem = {type: 'tuple', items: maze.map<any>((el: Array<string>) => {
                return { type: 'tuple', items: el.map(str => ({type: 'int', value: BigInt(str.charCodeAt(0))}))}
            })};
        const result = await provider.get('solve', [
            {type: 'int', value: BigInt(n)},
            {type: 'int', value: BigInt(m)},
            {type: 'tuple', items: tuple.items},
        ]);

        const res1 = [result.stack.readNumber(), result.stack.readNumber(), result.stack.readNumber()]

        const tuple_reader = result.stack.readTuple();

        return [res1[0], res1[1], res1[2], parseData(tuple_reader as any)];
    }

}
