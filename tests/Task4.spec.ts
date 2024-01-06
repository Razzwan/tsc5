import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Task4 } from '../wrappers/Task4';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import {coloredMaze} from '../util/colored-maze';

describe('Task4', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task4');
    });

    let blockchain: Blockchain;
    let task4: SandboxContract<Task4>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task4 = blockchain.openContract(Task4.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task4.sendDeploy(deployer.getSender(), toNano('100.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task4.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task4Basic are ready to use
    });

    it('get simplest result', async () => {
        // const was: any = [
        //     ['X', 'X', 'X', 'X', 'X', 'X', 'E', '.'],
        //     ['X', 'X', '.', 'X', 'X', 'X', 'X', '.'],
        //     ['X', '.', 'X', '.', 'X', 'X', '.', 'X'],
        //     ['.', '?', 'X', 'S', 'X', 'X', 'X', '.'],
        //     ['X', '?', 'X', 'X', 'X', 'X', 'X', '.'],
        //     ['X', 'X', '.', '.', 'X', 'X', 'X', '.'],
        //     ['X', 'X', 'X', '.', 'X', 'X', '?', 'X'],
        //     ['X', 'X', 'X', '.', 'X', '.', 'X', 'X'],
        //     ['X', 'X', 'X', '.', 'X', '.', 'X', 'X'],
        //     ['X', 'X', 'X', 'X', '.', '.', 'X', 'X'],
        // ];

        const was: any = [
            ['S', 'X', 'X'],
            ['X', 'X', 'X'],
            ['X', 'X', 'E'],
        ];

        // 1 -> 2 8 3 7 4 6 5
        // 2 -> 3 1 4 8 5 7 6
        // 3 -> 4 2 5 1 6 8 7
        // 4 -> 4 6 3 7 2 8 1
        // 5 -> 4 6 3 7 2 8 1
        // 6 -> 4 6 3 7 2 8 1
        // 7 -> 4 6 3 7 2 8 1
        // 8 -> 4 6 3 7 2 8 1
        const res = await task4.getSolve(was);

        coloredMaze(was);
        coloredMaze(res[3]);
        expect(res).toEqual(1);
    });
});
