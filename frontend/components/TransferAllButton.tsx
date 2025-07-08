import { useState, useEffect } from 'react';
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { Button } from 'antd';

interface TransferAllButtonprops {
  cortexAddress: `0x${string}`;
  escrow: `0x${string}`;
}

// const chain = 80001;
const chain = 42161;

export function TransferAllButton({ cortexAddress, escrow }: TransferAllButtonprops) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contractAddress: `0x${string}` | undefined = cortexAddress ? `${cortexAddress}` as const : undefined;
  const escrowAddress = `${escrow}` as const;
    const { config: transferConfig } = usePrepareContractWrite({
      address: contractAddress,
      abi: [
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_to",
              "type": "address"
            }
          ],
          "name": "transferAll",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'transferAll',
      args: [escrowAddress],
      chainId: chain
    });
  
    const { data: transferData, error: transferError, isError: isTransferError, write: transferWrite } = useContractWrite(transferConfig);
  
    const { isLoading: isTransferLoading, isSuccess: isTransferSuccess } = useWaitForTransaction({
      hash: transferData?.hash,
    });
  
    const handleSubmit = async () => {
      setIsSubmitting(true);
      transferWrite?.();
    };
  
    useEffect(() => {
      if (isTransferSuccess || isTransferError) {
        setIsSubmitting(false);
      }
    }, [isTransferSuccess, isTransferError]);
  
    return (
      <div>
        <Button loading={isTransferLoading} style={{color: isTransferLoading ? 'white':'black'}} disabled={isSubmitting || isTransferLoading || isTransferSuccess} onClick={handleSubmit}>
          {isSubmitting || isTransferLoading ? 'Processing...' : 'Transfer All'}
        </Button>
        {isTransferError && <div>Error transferring tokens: {transferError?.message}</div>}
        {isTransferSuccess && <div>Offer funded successfully!</div>}
      </div>
    );
}
  
export default TransferAllButton