import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Task4Basic } from '../wrappers/Task4Basic';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import {coloredMaze} from '../util/colored-maze';
import {gasUsage} from '../util/gas-usage';

describe('Task4Basic', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task4Basic');
    });

    let blockchain: Blockchain;
    let task4Basic: SandboxContract<Task4Basic>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task4Basic = blockchain.openContract(Task4Basic.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task4Basic.sendDeploy(deployer.getSender(), toNano('100'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task4Basic.address,
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
        const res = await task4Basic.getSolve(was);

        coloredMaze(was);
        coloredMaze(res[3]);
        expect(res).toEqual(1);
    });
});
