import dotenv from 'dotenv';
import { Server, Keypair, TransactionBuilder, Operation, Networks } from 'soroban-client';
import contracts from '../../config/contracts.json';

dotenv.config();

const networkPassphrase =
  process.env.SOROBAN_NETWORK === 'futurenet'
    ? Networks.FUTURENET
    : Networks.TESTNET;

const rpcUrl = process.env.SOROBAN_RPC_URL || 'https://rpc-futurenet.stellar.org';
const server = new Server(rpcUrl);

const source = (() => {
  const sec = process.env.ACCOUNT_SECRET_KEY;
  if (!sec) throw new Error('Missing ACCOUNT_SECRET_KEY in .env');
  return Keypair.fromSecret(sec);
})();

function requireContractId(name: keyof typeof contracts): string {
  const id = contracts[name];
  if (!id || id.startsWith('REPLACE')) {
    throw new Error(`Missing ${name} in config/contracts.json`);
  }
  return id;
}

async function submitTx(ops: Operation[], memo?: string) {
  const account = await server.getAccount(source.publicKey());
  const tx = new TransactionBuilder(account, { fee: '10000', networkPassphrase })
    .addOperations(ops)
    .setTimeout(60)
    .setMemo(memo ?? '')
    .build();
  tx.sign(source);
  const res = await server.sendTransaction(tx);
  if ('errorResult' in res) throw new Error('Transaction failed');
  return (res as any).id ?? (res as any).hash;
}

export async function createWill(owner: string, contentHash: string, beneficiaries: string[]) {
  const willId = requireContractId('willContractId');
  const op = Operation.bumpSequence({ bumpTo: '0' }); // TODO: replace with InvokeHostFunction
  return submitTx([op], `will:create:${owner}`);
}

export async function getWill(owner: string) {
  return {
    owner,
    contentHash: 'QmDummyHash',
    beneficiaries: [],
    executed: false,
  };
}

export async function executeWill(owner: string) {
  const willId = requireContractId('willContractId');
  const op = Operation.bumpSequence({ bumpTo: '0' }); // TODO: replace with InvokeHostFunction
  return submitTx([op], `will:execute:${owner}`);
}

export async function mintToken(to: string, amount: number) {
  const tokenId = requireContractId('tokenContractId');
  const op = Operation.bumpSequence({ bumpTo: '0' }); // TODO: replace with InvokeHostFunction
  return submitTx([op], `token:mint:${to}:${amount}`);
}