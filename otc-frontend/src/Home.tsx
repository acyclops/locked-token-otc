// src/pages/Home.tsx (or src/Home.tsx)
import * as React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from '../styles/Home.module.css';
import OfferPage from '../components/Offer';
import OfferList from '../components/OfferList';
import { Layout, Typography, Modal, Button } from 'antd';
import { grey } from '@ant-design/colors';
import { useWriteContract } from 'wagmi';
import { parseAbi, parseUnits } from 'viem';

// const chainId = 42161; // Arbitrum one
const chainId = 421614; // Arbitrum sepolia 

// Mainnet
// const usdcAddress    = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8';
// const cortexAddress  = '0xb21Be1Caf592A5DC1e75e418704d1B6d50B0d083';
// const lensAddress    = '0xA8029f0AECf2d085C00eBdEc19431f0A6Ab496F2';
// const factoryAddress = '0x86fff0Cf8C6F272F7c83837B448B2f7c45fB4F1D';

// Testnet
const cortexAddress = '0xAAB438C6881a8D7539d4A52724343bCdc54e32F1';
const usdcAddress = '0xD967b1C2c4B386B588c8abe27eb09c8696F64049';
const lensAddress = '0xd0196F7701Af69c556d483C99C8F06787c7977FB';
const factoryAddress = '0x5C25e37D1156F435Cf0858Cc2F644aEb74d8E1c2';

const Home: React.FC = () => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending: isWalletPending,
  } = useWriteContract();

  const cortexAbi = parseAbi([
    'function gibLocked(uint256 amount)',
  ]);

  const onGibTokens = () => {
    writeContract({
      address: cortexAddress,
      abi: cortexAbi,
      functionName: 'gibLocked',
      args: [parseUnits(String(100), 18)],
      chainId
    })
  }

  return (
    <Layout style={{ background: grey[7] }}>
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title} style={{ color: 'white', fontSize: 50 }}>
            Trustless CRX OTC Desk
          </h1>

          <div style={{ display: 'flex' }}>
            <Button onClick={() => setModalVisible(true)} style={{ fontSize: 24, blockSize: '50%', marginRight: 20 }}>
              FAQ
            </Button>
            <Button
              onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSeuRTsM_5GnIReHXP1eQE1lJZsNrkv0dgcmRAT2__fnBriQxw/viewform', '_blank')}
              style={{ fontSize: 24, blockSize: '50%' }}
            >
              Help
            </Button>
            <Button onClick={onGibTokens}>
              GIB TOKENS
            </Button>
          </div>

          <br />
          <ConnectButton />

          <Typography.Text style={{ color: grey[0], fontSize: 16, fontWeight: 600, padding: 15 }}>
            <OfferPage cortexAddress={cortexAddress} usdcAddress={usdcAddress} factoryAddress={factoryAddress} />
            <OfferList lensAddress={lensAddress} offerFactoryAddress={factoryAddress} usdcAddress={usdcAddress} />
          </Typography.Text>
        </main>
      </div>

      <Modal
        title="FAQ"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        styles={{
          body: { background: '#262626', padding: 20, color: 'white', borderColor: grey[8] }
        }}
        width={600}
      >
        <p>Verified Offer Factory: <a href={`https://arbiscan.io/address/${factoryAddress}`} target="_blank" rel="noopener noreferrer" style={{ color: '#6a5eff', textDecoration: 'underline' }}>{factoryAddress}</a></p>
        <p>{"Welcome to OTCRX.market: a trustless OTC market designed for trading locked Cortex (CRX) tokens with ease. OTCRX allows you to trade your locked CRX for USDC today without any middlemen."}</p>
        <p>{"Due to constraints on the CRX smart contract, there is no way to choose the amount of locked CRX you would like to trade. If you want to create an offer, it will be for ALL of your locked CRX. This also means that if you purchase locked CRX when you already have a balance, the two will be added together and you will be unable to 'split' the stack."}</p>
        <p>{"When you create an offer, an escrow contract will be deployed with your address set as the owner. Then, you'll call transferAll on the CRX contract with your newly created escrow as the recipient. This will transfer ALL of your locked and unlocked CRX tokens. OTCRX recommends transferring or staking your unlocked CRX before creating an offer."}</p>
        <p>{"OTCRX never takes custody of your assets, you are the only one with permissions for each individual escrow contract. You can always retrieve your locked CRX by calling cancel() on an escrow you own."}</p>
        <p>{"Before making a purchase, you will need to approve USDC for the escrow contract you are purchasing from. After the approval is confirmed, you will call fill() on the escrow. The escrow's owner will receive the USDC, and you will receive the locked CRX. This front-end only approves the necessary amount, no need to worry about infinite approvals."}</p>
        <p>{"OTCRX takes a 2.5% fee on each filled offer. (25,000 USDC maximum)"}</p>
      </Modal>
    </Layout>
  );
};

export default Home;
