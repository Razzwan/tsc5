import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import {beginCell, Cell, toNano} from 'ton-core';
import { Task1 } from '../wrappers/Task1';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import {TreasuryContract} from '@ton-community/sandbox/dist/treasury/Treasury';
import {gasCompare} from '../util/gas-usage';

describe('Task1', () => {
    let code: Cell;
    let owner: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        code = await compile('Task1');
    });

    let blockchain: Blockchain;
    let task1: SandboxContract<Task1>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task1 = blockchain.openContract(Task1.createFromConfig({}, code));

        owner = await blockchain.treasury('deployer');

        const deployResult = await task1.sendDeploy(owner.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: owner.address,
            to: task1.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task1 are ready to use
    });

    it('should throw error correctly', async () => {
        const cell = beginCell()
          .storeUint(0x9df10277, 32)
          .storeUint(62, 64)
          .storeUint(62, 512)
          .storeRef(beginCell().storeUint(0, 31).storeUint(0, 32).endCell())
          .endCell();
        const r1 = await task1.send(owner.getSender(), toNano('0.05'), cell);

        gasCompare(r1, 19779651n, 7n);
    });
});
