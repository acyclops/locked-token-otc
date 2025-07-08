import React, { useState, useEffect } from 'react';
import { useSigner, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from 'wagmi';
import { Button } from 'antd';
import { Address } from 'wagmi';

interface FillOfferProps {
  offerAddress: Address;
  usdcAddress: Address;
  amountUSDC: number;
}

// const chain = 80001;
const chain = 42161;

const FillOffer = ({ offerAddress, usdcAddress, amountUSDC }: FillOfferProps) => {
  const [status, setStatus] = useState('');
  const [isApproved, setIsApproved] = useState(false);

  const { config: approveConfig, error: approveError } = usePrepareContractWrite({
    address: usdcAddress,
    abi: ['function approve(address spender, uint256 amount) public returns (bool)'],
    functionName: 'approve',
    args: [offerAddress, amountUSDC],
  });
  const { data: approveData, write: approve, isLoading: isApproving } = useContractWrite(approveConfig);

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransaction({
    hash: approveData?.hash,
  });

  const { config: fillOfferConfig, refetch } = usePrepareContractWrite({
    address: offerAddress,
    abi: ['function fill() public'],
    functionName: 'fill',
    chainId: chain,
  });

  const { data: fillData, write: fillOffer, isLoading: isFilling, isError: isFillError }
    = useContractWrite(fillOfferConfig);
  
  const { isLoading: isFillLoading, isSuccess: isFillSuccess } = useWaitForTransaction({
    hash: fillData?.hash,
  });

  useEffect(() => {
    if (isFillSuccess) {
      setStatus('Offer filled successfully')
    }
    if (isFillError) {
      setStatus(`Error filling offer`);
    }
  }, [isFillError, isFillSuccess]);

  useEffect(() => {
    if (isApproveSuccess) {
      setIsApproved(true);
    }
  }, [isApproveSuccess]);

  useEffect(() => {
    refetch();
  }, [refetch, isApproveSuccess]);

  const handleApprove = () => {
    approve?.();
  };

  const handleFillOffer = () => {
    if (fillOffer) {
      fillOffer?.();
    }
  };

  if (approveError) {
    return <div>An approve error occurred while preparing the approve transaction: {approveError.message}</div>;
  }

  return (
    <div>
      {!isApproved ? (
        <Button loading={isApproveLoading} onClick={handleApprove} disabled={isApproving || isApproveLoading }>
          {isApproving || isApproveLoading ? 'Approving...' : 'Approve USDC'}
        </Button>
      ) : (
        !isFillSuccess && (
            <Button style={{color: 'black'}} loading={isFillLoading} onClick={handleFillOffer} disabled={ !fillOffer || isFillLoading}>
            {isFilling ? 'Filling...' : 'Fill Offer'}
          </Button>
        )
      )}
      {!isFillLoading || isFillError ? <p>{status}</p> : null}
    </div>
  );
};

export default FillOffer;
