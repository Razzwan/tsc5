import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode, Tuple,
    TupleItem, TupleItemInt
} from 'ton-core';
import {parseData} from '../util/parseData';
import {coloredMaze} from '../util/colored-maze';

export type Task4BasicConfig = {};

export function task4BasicConfigToCell(config: Task4BasicConfig): Cell {
    return beginCell().endCell();
}

export class Task4Basic implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task4Basic(address);
    }

    static createFromConfig(config: Task4BasicConfig, code: Cell, workchain = 0) {
        const data = task4BasicConfigToCell(config);
        const init = { code, data };
        return new Task4Basic(contractAddress(workchain, init), init);
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
