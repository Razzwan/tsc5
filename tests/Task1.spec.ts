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
    let public_key: number = 0x449A4E06B6D9513A0F88F33A91C12B946B63607D5E444A0F55AB438ADC8F33B0;

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
            execution_time: Math.floor(new Date().getTime()/1000) + 30,
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
        // в секундах
        const locked_for = 60;

        const cell = beginCell()
          .storeUint(op, 32)
          // query_id - не используется
          .storeUint(0, 64)
          .storeUint(0x924F341FC1161133419086CC032CE8FB7E9DBAB76A8502D546D941C5246762CE097973C83772B30D29D0BCC13E8E87432D5FC4FE7B64C66AFD7755D95897B40C, 512)
          .storeRef(beginCell().storeUint(locked_for, 32).storeUint(1, 32).endCell())
          .endCell();
        const r1 = await task1.sendExternal(cell);
        // const r1 = await task1.send(owner.getSender(), toNano('0.05'), cell);

        // console.log(r1.transactions);
        const receiver = await task1.getReceiver();
        const seqno2 = await task1.getSeqno();
        expect(receiver).toEqualAddress(owner.address);

        // const hash = await task1.getHash();
        // expect(hash.toString(16)).toEqual('');

        expect(seqno2).toEqual(1);
        const time = await task1.getExecutionTime();
        expect(time).toEqual(Math.floor(new Date().getTime()/1000) + locked_for);
        gasCompare(r1, 4159000n);
        // gasCompare(r1, 8159990n);
    });
});
