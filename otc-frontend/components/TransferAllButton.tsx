import { useState, useEffect } from 'react';
import { Button } from 'antd';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseAbi } from 'viem';

interface TransferAllButtonProps {
  cortexAddress: Address;
  escrow: Address;
}

// const chainId = 42161; // Arbitrum one
const chainId = 421614; // Arbitrum sepolia 

const abi = parseAbi([
  'function transferAll(address _to) external',
]);

export default function TransferAllButton({ cortexAddress, escrow }: TransferAllButtonProps) {
  const { isConnected } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    writeContract,
    data: hash,                 // hash of the submitted tx
    error: writeError,
    isPending,                  // waiting for wallet confirmation
  } = useWriteContract();

  const {
    isLoading: isConfirming,    // waiting for on-chain confirmation
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = () => {
    setIsSubmitting(true);
    try {
      writeContract({
        address: cortexAddress,
        abi,
        functionName: 'transferAll',
        args: [escrow],
        chainId,
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isSuccess || writeError || receiptError) setIsSubmitting(false);
  }, [isSuccess, writeError, receiptError]);

  const disabled = !isConnected || isSubmitting || isPending || isConfirming || isSuccess;

  return (
    <div>
      <Button
        loading={isPending || isConfirming}
        disabled={disabled}
        onClick={handleSubmit}
        style={{ color: (isPending || isConfirming) ? 'white' : 'black' }}
      >
        {(isPending || isConfirming) ? 'Processing...' : 'Transfer All'}
      </Button>

      {writeError && <div style={{color:'tomato'}}>Wallet error: {writeError.message}</div>}
      {receiptError && <div style={{color:'tomato'}}>Tx error: {receiptError.message}</div>}
      {isSuccess && <div>Offer funded successfully!</div>}
    </div>
  );
}
