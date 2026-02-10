import { useEffect, useState } from 'react';
import { Button } from 'antd';
import type { Address } from 'viem';
import { parseAbi, parseUnits } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';

interface FillOfferProps {
  offerAddress: Address;
  usdcAddress: Address;
  amountUSDC: number; // human units, e.g. 123.45
}

// const chainId = 42161; // Arbitrum one
const chainId = 421614; // Arbitrum sepolia 

// Minimal ABIs
const erc20Abi = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
]);

const offerAbi = parseAbi([
  'function fill()',
]);

const FillOffer = ({ offerAddress, usdcAddress, amountUSDC }: FillOfferProps) => {
  const { isConnected } = useAccount();
  const [status, setStatus] = useState('');
  const [isApproved, setIsApproved] = useState(false);

  // Keep separate write hooks so we can track hashes independently
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveWriteError,
  } = useWriteContract();

  const {
    isLoading: isApproveLoading,
    isSuccess: isApproveSuccess,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: writeFill,
    data: fillHash,
    isPending: isFillPending,
    error: fillWriteError,
  } = useWriteContract();

  const {
    isLoading: isFillLoading,
    isSuccess: isFillSuccess,
    error: fillReceiptError,
  } = useWaitForTransactionReceipt({ hash: fillHash });

  // When approve confirms on-chain, mark as approved
  useEffect(() => {
    if (isApproveSuccess) {
      setIsApproved(true);
      setStatus('Approval confirmed. You can now fill the offer.');
    }
  }, [isApproveSuccess]);

  // Update status on fill success/error
  useEffect(() => {
    if (isFillSuccess) setStatus('Offer filled successfully');
    if (fillWriteError || fillReceiptError) setStatus('Error filling offer');
  }, [isFillSuccess, fillWriteError, fillReceiptError]);

  // Surface approve errors
  useEffect(() => {
    if (approveWriteError || approveReceiptError) {
      setStatus('Error approving USDC');
    }
  }, [approveWriteError, approveReceiptError]);

  const handleApprove = () => {
    if (!isConnected) return;
    // Convert human amount (e.g. 123.45) to USDC 6-decimal bigint
    const amount6 = parseUnits(String(amountUSDC ?? 0), 6);
    writeApprove({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [offerAddress, amount6],
      chainId,
    });
  };

  const handleFillOffer = () => {
    if (!isConnected || !isApproved) return;
    writeFill({
      address: offerAddress,
      abi: offerAbi,
      functionName: 'fill',
      args: [],
      chainId,
    });
  };

  const approveDisabled =
    !isConnected || isApprovePending || isApproveLoading || isApproveSuccess;

  const fillDisabled =
    !isConnected || !isApproved || isFillPending || isFillLoading || isFillSuccess;
  
  const explorer = "";

  return (
    <div>
      {!isApproved ? (
        <Button
          loading={isApprovePending || isApproveLoading}
          onClick={handleApprove}
          disabled={approveDisabled}
        >
          {isApprovePending || isApproveLoading ? 'Approving…' : 'Approve USDC'}
        </Button>
      ) : (
        !isFillSuccess && (
          <Button
            style={{ color: 'black' }}
            loading={isFillPending || isFillLoading}
            onClick={handleFillOffer}
            disabled={fillDisabled}
          >
            {isFillPending || isFillLoading ? 'Filling…' : 'Fill Offer'}
          </Button>
        )
      )}

      {isFillSuccess && (
        <>
          <Button disabled>Filled ✓</Button>
          {fillHash && explorer && (
            <a
              href={`${explorer}/tx/${fillHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', color: '#6a5eff' }}
            >
              View tx
            </a>
          )}
        </>
      )}

      {status && <p>{status}</p>}
    </div>
  );
};

export default FillOffer;
