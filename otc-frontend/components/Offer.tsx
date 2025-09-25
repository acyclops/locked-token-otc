// OfferPage.tsx — wagmi v2 / viem version
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Address, parseAbi, parseUnits, decodeEventLog } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import useDebounce from './useDebounce';
import UserCrxBalance from './UserCrxBalance';
import TransferAllButton from './TransferAllButton';
import { grey } from '@ant-design/colors';
import { Button, Input, Card } from 'antd';

const darkerGrey = grey[6];
const borderGrey = grey[9];
const chainId = 42161; // Arbitrum One

interface OfferPageProps {
  cortexAddress: Address;
  usdcAddress: Address;
  factoryAddress: Address;
}

// Function + event ABI (typed)
const abi = parseAbi([
  'function createOffer(address _tokenWanted, uint256 _amountWanted) returns (address)',
  'event OfferCreated(address offerAddress, address tokenWanted, uint256 amountWanted)',
]);

export default function OfferPage({ cortexAddress, usdcAddress, factoryAddress }: OfferPageProps) {
  const [amountWanted, setAmountWanted] = useState<number | null>(null);
  const [amountWantedPer, setAmountWantedPer] = useState<number | null>(null);
  const [offerAddress, setOfferAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce the numeric input
  const debouncedAmountWanted = useDebounce<number | null>(amountWanted, 500);

  // Prepare write (v2: call writeContract directly)
  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending: isWalletPending, // waiting for wallet confirmation
  } = useWriteContract();

  // Wait for on-chain confirmation
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Parse OfferCreated event when tx is confirmed
  useEffect(() => {
    if (!isConfirmed || !receipt) return;

    // Try to find the OfferCreated event in logs
    for (const log of receipt.logs ?? []) {
      try {
        const decoded = decodeEventLog({
          abi,
          topics: log.topics,
          data: log.data,
        });
        if (decoded.eventName === 'OfferCreated') {
          const args = decoded.args as { offerAddress: Address };
          setOfferAddress(args.offerAddress);
          setError('');
          break;
        }
      } catch {
        // skip non-matching logs
      }
    }
    setIsLoading(false);
  }, [isConfirmed, receipt]);

  // Surface write/receipt errors
  useEffect(() => {
    if (writeError || receiptError) {
      setError('Error creating offer. Please try again.');
      setIsLoading(false);
    }
  }, [writeError, receiptError]);

  // Handlers for inputs (lockedBalance = locked CRX amount)
  function handleChange(e: React.ChangeEvent<HTMLInputElement>, lockedBalance: number) {
    if (lockedBalance !== 0) {
      const v = Number(e.target.value || '0');
      setAmountWanted(v);
      setAmountWantedPer(v / lockedBalance);
    }
  }

  function handleChangePer(e: React.ChangeEvent<HTMLInputElement>, lockedBalance: number) {
    if (lockedBalance !== 0) {
      const per = Number(e.target.value || '0');
      setAmountWantedPer(per);
      setAmountWanted(per * lockedBalance);
    }
  }

  // Submit createOffer
  const onCreateOffer = () => {
    if (!debouncedAmountWanted || debouncedAmountWanted <= 0) return;

    // Cap at 1,000,000,000 and convert to 6 decimals (USDC)
    const capped = Math.min(debouncedAmountWanted, 1_000_000_000);
    const amountWanted6 = parseUnits(String(capped), 6); // bigint

    setIsLoading(true);
    setError('');
    setOfferAddress(null);

    writeContract({
      address: factoryAddress,
      abi,
      functionName: 'createOffer',
      args: [usdcAddress, amountWanted6],
      chainId,
    });
  };

  return (
    <Card
      title="Create Offer"
      style={{ textAlign: 'center', backgroundColor: darkerGrey, borderColor: borderGrey, color: 'white' }}
      headStyle={{ fontSize: '28px', borderBottom: `1px solid ${borderGrey}`, color: 'white' }}
    >
      <UserCrxBalance cortexAddress={cortexAddress}>
        {([balance, totalBalance]: number[]) => {
          const locked = Math.max(totalBalance - balance, 0);

          return (
            <div style={{ fontSize: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}>
              <div style={{ marginBottom: '16px' }}>
                <p>Locked CRX balance: {locked}</p>
                <p>Unlocked CRX balance: {balance}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="amountWanted" style={{ color: 'white' }}>Total USDC:</label>
                  <Input
                    id="amountWanted"
                    type="number"
                    max={1_000_000_000}
                    placeholder="0"
                    value={amountWanted ?? ''}
                    onChange={(e) => handleChange(e, locked)}
                    style={{ color: 'black' }}
                  />
                </div>

                <div>
                  <label htmlFor="amountWantedPer" style={{ color: 'white' }}>USDC per CRX:</label>
                  <Input
                    id="amountWantedPer"
                    type="number"
                    placeholder="0"
                    value={amountWantedPer ?? ''}
                    onChange={(e) => handleChangePer(e, locked)}
                    style={{ color: 'black' }}
                  />
                </div>

                <div>
                  <p>You will receive: {amountWanted ? (amountWanted * 97.5) / 100 : 0} USDC</p>
                </div>

                <div style={{ marginTop: '16px' }}>
                  {balance > 1 ? (
                    <div>
                      <p style={{ color: 'red' }}>
                        Creating an offer will transfer ALL of your locked and unlocked CRX to the escrow.
                      </p>
                      <p style={{ color: 'red' }}>
                        Please stake or transfer your unlocked CRX before creating another offer.
                      </p>
                    </div>
                  ) : (
                    <Button
                      loading={isLoading || isWalletPending || isConfirming}
                      onClick={onCreateOffer}
                      disabled={
                        !debouncedAmountWanted ||
                        locked === 0 ||
                        isWalletPending ||
                        isConfirming ||
                        isConfirmed
                      }
                      style={{ color: 'black' }}
                    >
                      {isLoading || isWalletPending || isConfirming ? 'Creating offer...' : 'Create Offer'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      </UserCrxBalance>

      {error && <p style={{ color: 'white' }}>{error}</p>}
      {isConfirming && <p style={{ color: 'white' }}>Waiting for transaction confirmation...</p>}
      {offerAddress && <TransferAllButton cortexAddress={cortexAddress} escrow={offerAddress} />}
    </Card>
  );
}
