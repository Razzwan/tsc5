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
    let public_key: bigint = 124n;

    beforeAll(async () => {
        code = await compile('Task1');
    });

    let blockchain: Blockchain;
    let task1: SandboxContract<Task1>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        owner = await blockchain.treasury('deployer');

        task1 = blockchain.openContract(Task1.createFromConfig({
            public_key,
            receiver: owner.address,
            execution_time: 1000,
        }, code));

        const deployResult = await task1.sendDeploy(owner.getSender(), toNano('1'));

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
        const seqno1 = await task1.getSeqno();
        expect(seqno1).toEqual(0);

        const op = 0x9df10277;

        const cell = beginCell()
          .storeUint(op, 32)
          .storeUint(62, 64)
          .storeUint(62, 512)
          .storeRef(beginCell().storeUint(0, 32).storeUint(1, 32).endCell())
          .endCell();
        const r1 = await task1.send(owner.getSender(), toNano('0.5'), cell);

        // console.log(r1.transactions);
        const receiver = await task1.getReceiver();
        const seqno2 = await task1.getSeqno();
        expect(receiver).toEqualAddress(owner.address);

        expect(seqno2).toEqual(1);
        gasCompare(r1, 7677990n);
    });
});
