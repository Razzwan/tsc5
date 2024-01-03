import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import {Address, beginCell, Cell, fromNano, toNano} from 'ton-core';
import { Task2 } from '../wrappers/Task2';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import {TreasuryContract} from '@ton-community/sandbox/dist/treasury/Treasury';

const USER_AMOUNT = 10;

describe('Task2', () => {
    let code: Cell;
    let admin: SandboxContract<TreasuryContract>;
    let users: Array<SandboxContract<TreasuryContract>> = [];
    let users_no_shares: Array<SandboxContract<TreasuryContract>> = [];

    beforeAll(async () => {
        code = await compile('Task2');
    });

    let blockchain: Blockchain;
    let task2: SandboxContract<Task2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        admin = await blockchain.treasury('admin');
        let tons: number = 101;
        let total_shares: number = 100;

        let map_entries: Array<[Address, number]> = [];
        for (let i = 0; i < USER_AMOUNT; i++) {
            const user = await blockchain.treasury(`user_${i}`);
            users.push(user);
            tons += i;
            total_shares += i;
            map_entries.push([user.address, i]);
        }

        for (let i = 0; i < 10; i++) {
            users_no_shares.push(await blockchain.treasury(`user_no_shares_${i}`));
        }

        task2 = blockchain.openContract(Task2.createFromConfig({
            admin_address: admin.address,
            users: new Map([
              [admin.address, 100],
              ...map_entries
            ]),
            total: total_shares,
        }, code));

        const deployResult = await task2.sendDeploy(admin.getSender(), toNano(tons));

        expect(deployResult.transactions).toHaveTransaction({
            from: admin.address,
            to: task2.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task2 are ready to use
    });

    it('test dictionary shares getter', async () => {
        const admin_address = await task2.getAdminAddress();
        expect(admin_address).toEqualAddress(admin.address);

        const user_shares = await task2.getAddressShares();

        expect(user_shares.get(admin_address.hash)).toEqual(100);

        for (let i = 0; i < USER_AMOUNT; i++) {
            expect(user_shares.get(users[i].address.hash)).toEqual(i);

            const share_int = await task2.getSharesByAddress(users[i].address);
            expect(share_int).toEqual(i);
        }

        for (let i = 0; i < 10; i++) {
            const share_int = await task2.getSharesByAddress(users_no_shares[i].address);
            expect(share_int).toEqual(0);
        }
    });

    it('add new user with shares', async () => {
        const add_user = 0x368ddef3;
        const msg = beginCell()
          .storeUint(add_user, 32)
          // query_id - не используется
          .storeUint(0, 64)
          .storeAddress(users_no_shares[0].address)
          .storeUint(200, 32)
          .endCell();
        const res = await task2.send(admin.getSender(), toNano('0.05'), msg);
        expect(res.transactions).toHaveTransaction({
            from: admin.address,
            to: task2.address,
            op: add_user,
            success: true,
        });

        const added_user_shares = await task2.getSharesByAddress(users_no_shares[0].address);
        expect(added_user_shares).toEqual(200);
    });

    it('update user to add shares', async () => {
        const add_user = 0x368ddef3;

        const user = users[1];

        const msg = beginCell()
          .storeUint(add_user, 32)
          // query_id - не используется
          .storeUint(0, 64)
          .storeAddress(user.address)
          .storeUint(200, 32)
          .endCell();
        const res = await task2.send(admin.getSender(), toNano('0.05'), msg);
        expect(res.transactions).toHaveTransaction({
            from: admin.address,
            to: task2.address,
            op: add_user,
            success: true,
        });

        const updated_user_shares = await task2.getSharesByAddress(user.address);
        expect(updated_user_shares).toEqual(201);
    });

    it('remove user from shares list', async () => {
        const remove_user = 0x278205c8;

        const user = users[1];

        const msg = beginCell()
          .storeUint(remove_user, 32)
          // query_id - не используется
          .storeUint(0, 64)
          .storeAddress(user.address)
          .endCell();
        const res = await task2.send(admin.getSender(), toNano('0.05'), msg);
        expect(res.transactions).toHaveTransaction({
            from: admin.address,
            to: task2.address,
            op: remove_user,
            success: true,
        });

        const updated_user_shares = await task2.getSharesByAddress(user.address);
        expect(updated_user_shares).toEqual(0);
    });

    it('prefix', async () => {
        const prefix = await task2.getPrefix();
        expect(prefix).toEqual(267);
        // // 8002FB6A070F918770AFAC73231DE4A7A06BF63FE2A845B1ECEDC102B5A570D6425_
        // // 8002FB6A070F918770AFAC73231DE4A7A06BF63FE2A845B1ECEDC102B5A570D6425_

    });

    it('distribute tons to all users', async () => {
        const split_tons = 0x068530b3;

        const msg = beginCell()
          .storeUint(split_tons, 32)
          // query_id - не используется
          .storeUint(0, 64)
          .endCell();
        const res = await task2.send(admin.getSender(), toNano('0.05'), msg);
        console.log(res);
        expect(res.transactions).toHaveTransaction({
            from: admin.address,
            to: task2.address,
            op: split_tons,
            success: true,
        });
        // expect(res.transactions).toHaveTransaction({
        //     from: task2.address,
        //     to: admin.address,
        //     success: true,
        // });

        // const user_length = users.length;
        // for (let i = 0; i < user_length; i++) {
        //     expect(res.transactions).toHaveTransaction({
        //         from: task2.address,
        //         to: users[i].address,
        //         success: true,
        //     });
        // }
    });
});
