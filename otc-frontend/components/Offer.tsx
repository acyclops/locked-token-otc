import * as React from 'react';
import { useEffect, useState } from 'react';
import { Address, parseAbi, parseUnits, decodeEventLog } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import useDebounce from './useDebounce';
import UserCrxBalance from './UserCrxBalance';
import TransferAllButton from './TransferAllButton';
import { Button, Input, Card } from 'antd';
import styles from '../styles/Offer.module.css';

// const chainId = 42161; // Arbitrum one
const chainId = 421614; // Arbitrum sepolia 

interface OfferPageProps {
  cortexAddress: Address;
  usdcAddress: Address;
  factoryAddress: Address;
}

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

  // Prepare write
  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending: isWalletPending,
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

  useEffect(() => {
    if (writeError || receiptError) {
      setError('Error creating offer. Please try again.');
      setIsLoading(false);
    }
  }, [writeError, receiptError]);

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

  // Submit createOffer to the factory
  const onCreateOffer = () => {
    if (!debouncedAmountWanted || debouncedAmountWanted <= 0) return;

    // Cap at 1,000,000,000 and convert USDC amountt to 6 decimals
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
      className={styles.offerCard}
    >
      <UserCrxBalance cortexAddress={cortexAddress}>
        {([balance, totalBalance]: number[]) => {
          const locked = Math.max(totalBalance - balance, 0);

          return (
            <div className={styles.content}>
              <div className={styles.balances}>
                <p>
                  Locked CRX balance:{' '}
                  <span className={styles.balanceValue}>{locked}</span>
                </p>
                <p>
                  Unlocked CRX balance:{' '}
                  <span className={styles.balanceValue}>{balance}</span>
                </p>
              </div>

              <div className={styles.inputStack}>
                <div className={styles.inputGroup}>
                  <label htmlFor="amountWanted" className={styles.label}>Total USDC:</label>
                  <Input
                    id="amountWanted"
                    type="number"
                    max={1_000_000_000}
                    placeholder="0"
                    value={amountWanted ?? ''}
                    onChange={(e) => handleChange(e, locked)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="amountWantedPer" className={styles.label}>USDC per CRX:</label>
                  <Input
                    id="amountWantedPer"
                    type="number"
                    placeholder="0"
                    value={amountWantedPer ?? ''}
                    onChange={(e) => handleChangePer(e, locked)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.estimate}>
                  <p>You will receive: {amountWanted ? (amountWanted * 97.5) / 100 : 0} USDC</p>
                </div>

                <div className={styles.buttonRow}>
                  {balance > 1 ? (
                    <div>
                      <p className={styles.warning}>
                        Creating an offer will transfer ALL of your locked and unlocked CRX to the escrow.
                      </p>
                      <p className={styles.warning}>
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
                      className={styles.actionBtn}
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

      {error && <p className={styles.error}>{error}</p>}
      {isConfirming && <p className={styles.status}>Waiting for transaction confirmation...</p>}
      {offerAddress && <TransferAllButton cortexAddress={cortexAddress} escrow={offerAddress} />}
    </Card>
  );
}
