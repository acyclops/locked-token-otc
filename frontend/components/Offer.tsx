// Import ethers.js library from wagmi
import { ethers } from "ethers";
import * as React from "react";
import { useEffect, useState } from "react";
import { BigNumber } from 'ethers';
import { Address } from 'wagmi';
import useDebounce from "./useDebounce";
import UserCrxBalance from "./UserCrxBalance";
import TransferAllButton from './TransferAllButton'
import { grey } from '@ant-design/colors'
import { Button, Input, Card } from 'antd';
import {
  usePrepareContractWrite,
  useWaitForTransaction,
  useContractWrite,
} from 'wagmi';

let abi = [ "event OfferCreated(address offerAddress, address tokenWanted, uint amountWanted)" ];
let iface = new ethers.utils.Interface(abi);
const darkerGrey = grey[6];
const borderGrey = grey[9];

// const chain = 80001;
const chain = 42161;

interface OfferPageProps {
  cortexAddress: Address;
  usdcAddress: Address;
  factoryAddress: Address;
}

// Define a React component for the offer page
export function OfferPage({ cortexAddress, usdcAddress, factoryAddress }: OfferPageProps) {
  // Define React state variables for user Input and offer address
  const [amountWanted, setAmountWanted] = useState<number | null>(null);
  const [amountWantedPer, setAmountWantedPer] = useState<number | null>(null);
  const [offerAddress, setOfferAddress] = useState<`0x${string}`| null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const debouncedAmountWanted = useDebounce<number | null>(amountWanted, 500);

  const {
    config: factoryConfig,
    error: factoryError,
    isError: isFactoryError,
  } = usePrepareContractWrite({
    address: factoryAddress,
    abi: [
      {
        name: "createOffer",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          {
            internalType: "address",
            name: "_tokenWanted",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "_amountWanted",
            type: "uint256",
          },
        ],
        outputs: [
          {
            internalType: "contract LockedCortexOffer",
            name: "",
            type: "address",
          },
        ],
      },
    ],
    functionName: "createOffer",
    args: [usdcAddress, BigNumber.from(Math.min((debouncedAmountWanted || 0), 1000000000) * 10 ** 6)],
    enabled: Boolean(debouncedAmountWanted),
    chainId: chain
  });

  const { data: factoryData, error: factoryWriteError, isError: isFactoryWriteError, write: factoryWrite } = useContractWrite(factoryConfig);

  const { data: dataa, isLoading: isFactoryLoading, isSuccess: isFactorySuccess } = useWaitForTransaction({
    hash: factoryData?.hash,
  });

  useEffect(() => {
    if (dataa && dataa.blockNumber) {
      let event = iface.parseLog(dataa.logs[0]);
      setOfferAddress(event.args.offerAddress);
      setIsLoading(false);
      setError('');
    }
  }, [dataa]);

  useEffect(() => {
    if (factoryError || factoryWriteError) {
      setError("Error creating offer. Please try again.");
      setIsLoading(false);
    }
  }, [factoryError, factoryWriteError]);

  // Define a function to handle user Input change
  function handleChange(event: React.ChangeEvent<HTMLInputElement>, lockedBalance: number) {
    if (lockedBalance !== 0) {
      setAmountWanted(parseInt(event.target.value));
      setAmountWantedPer(parseInt(event.target.value) / lockedBalance);
    }
  }
  
  function handleChangePer(event: React.ChangeEvent<HTMLInputElement>, lockedBalance: number) {
    if (lockedBalance !== 0) {
      setAmountWanted(parseFloat(event.target.value) * lockedBalance);
      setAmountWantedPer(parseFloat(event.target.value));
    }
  }
  

  return (
    <Card
  title="Create Offer"
  style={{
    textAlign: "center",
    backgroundColor: darkerGrey,
    borderColor: borderGrey,
    color: "white",
  }}
  headStyle={{ fontSize: '28px', borderBottom: `1px solid ${borderGrey}`, color: "white" }}
>
  <UserCrxBalance cortexAddress={cortexAddress}>
    {([balance, totalBalance]: number[]) => (
      <div style={{ fontSize: '20px', display: "flex", flexDirection: "column", alignItems: "center", color: "white" }}>
        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "white" }}>Locked CRX balance: {totalBalance - balance}</p>
          <p style={{ color: "white" }}>Unlocked CRX balance: {balance}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white" }}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="amountWanted" style={{ color: "white" }}>Total USDC:</label>
            <Input max={1000000000} id="amountWanted" type="number" placeholder={"0"} value={amountWanted != null ? amountWanted.toString() : ""} onChange={e => handleChange(e, totalBalance - balance)} style={{ color: "black" }} />
          </div>
          <div>
            <label  htmlFor="amountWantedPer" style={{ color: "white" }}>USDC per CRX:</label>
            <Input type="number" id="amountWantedPer" placeholder={"0"} value={amountWantedPer != null ? amountWantedPer.toString() : ""} onChange={e => handleChangePer(e, totalBalance - balance)} style={{ color: "black" }} />
              </div>
              <div>
                <p>You will receive: { amountWanted && amountWanted * 97.5 / 100} USDC</p>
              </div>
          <div style={{ marginTop: "16px" }}>
            {balance > 1 ? (
              <div>
                  <p style={{ color: "red" }}>Creating an offer will transfer ALL of your locked and unlocked CRX to the escrow.</p>
                <p style={{ color: "red" }}>Please stake or transfer your unlocked CRX to a different wallet before attempting to create another offer.</p>
              </div>
            ) : (
              <Button
                loading={isLoading}
                onClick={(e) => {
                  setIsLoading(true);
                  factoryWrite?.();
                }}
                disabled={!Boolean(debouncedAmountWanted) || isFactoryLoading || isFactorySuccess || totalBalance - balance === 0}
                style={{ color: "black" }}
              >
                {isLoading ? "Creating offer..." : "Create Offer"}
              </Button>
            )}
          </div>
        </div>
      </div>
    )}
  </UserCrxBalance>
  {error && <p style={{ color: "white" }}>{error}</p>}
  {offerAddress && <TransferAllButton cortexAddress={cortexAddress} escrow={offerAddress} />}
  {isFactoryLoading && <p style={{ color: "white" }}>Waiting for transaction confirmation...</p>}
</Card>

  );
  
}

export default OfferPage;