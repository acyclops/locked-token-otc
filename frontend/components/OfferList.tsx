import React, { useEffect, useState } from 'react';
import { useContractRead, useSigner, useContractWrite, useWaitForTransaction, Address } from 'wagmi';
import { lensAbi } from '../lens-abi';
import { BigNumber } from 'ethers';
import FillOffer from './FillOffer'
import { Button, Card } from 'antd';
import { grey } from '@ant-design/colors'

const borderGrey = grey[9];
const darkerGrey = grey[6];

interface OfferItemProps {
  offer: {
    offerAddress: Address;
    cortexBalance: number;
    tokenWanted: Address;
    amountWanted: number;
    pricePerCRX: number;
  };
  onCancel?: () => void;
  seller: Seller;
  user: Address | string;
  usdcAddress: Address;
}


interface Seller {
  seller: string | undefined;
}


interface SellerAddressProps {
  offerAddress: Address;
  children: ({ seller }: { seller: string | undefined }) => JSX.Element;
}


interface OfferListProps {
  lensAddress: Address;
  offerFactoryAddress: Address;
  usdcAddress: Address;
}

// const chain = 80001;
const chain = 42161;
const decimals = BigNumber.from('1000000000000000000');

const useOfferCancellation = (offerAddress: Address) => {
  const writeConfig = {
    address: offerAddress,
    abi: ['function cancel() external'],
    functionName: 'cancel',
    chainId: chain,
  };

  const { data ,write } = useContractWrite(writeConfig as any);

  return { data, write };
};

const SellerAddress = ({ offerAddress, children }: SellerAddressProps) => {
  const { data: seller } = useContractRead({
    address: offerAddress,
    abi: ['function seller() public view returns (address)'],
    functionName: 'seller',
    chainId: chain,
  });

  return <>{seller && children({ seller: seller.toString() })}</>;
};

const OfferList = ({ lensAddress, offerFactoryAddress, usdcAddress }: OfferListProps) => {
  const [user, setUser] = useState('');
  const { data: signer } = useSigner();
  useEffect(() => {
    if (signer) {
      signer.getAddress().then((address) => {
        setUser(address);
      });
    }
  }, [signer]);

  const { data: activeOffers, error } = useContractRead({
    address: lensAddress,
    abi:       lensAbi,
    functionName: 'getAllActiveOfferInfo',
    args: [offerFactoryAddress],
    chainId: chain,
  });
  
  if (error) {
    return <p>Error: {error.message}</p>;
  }
  
  if (!activeOffers || activeOffers.offerAddresses.length === 0) {
    return <p style={{textAlign: 'center'}}>No active offers</p>;
  }

  const sortedOffers = activeOffers && activeOffers.offerAddresses.map((address, index) => ({
    offerAddress: address,
    cortexBalance: activeOffers.cortexBalances[index].div(decimals).toNumber(),
    tokenWanted: activeOffers.tokenWanted[index],
    amountWanted: activeOffers.amountWanted[index].toNumber(),
    pricePerCRX: (activeOffers.amountWanted[index].mul(10**12).div(activeOffers.cortexBalances[index])).toNumber(),
  })).sort((a, b) => a.pricePerCRX - b.pricePerCRX);

  return (
    <div>
      <h2 style={{ color: 'white', textAlign: "center" }}>Active Offers</h2>
      <p style={{ color: 'white', textAlign: "center" }}>Sorted by $ per CRX</p>
      <ul style={{ display: 'grid', gap: '15px' }}>
        {sortedOffers && sortedOffers.map((offer, index) => (
          <SellerAddress key={offer.offerAddress} offerAddress={offer.offerAddress}>
            {seller => (
              <OfferItem
                key={index}
                offer={offer}
                seller={seller}
                user={user}
                usdcAddress={usdcAddress}
              />
            )}
          </SellerAddress>
        ))}
      </ul>
    </div>
  );  
}

const OfferItem = ({ offer, onCancel, seller, user, usdcAddress }: OfferItemProps) => {
  const [isCanceling, setIsCanceling] = useState(false);

  const { data: cancelHash, write: cancelOffer } = useOfferCancellation(offer.offerAddress);
  const {isSuccess, isLoading} = useWaitForTransaction(cancelHash);
  const handleCancel = async () => {
    try {
      setIsCanceling(true);
      await cancelOffer?.();
    } catch (error) {
      setIsCanceling(false);
    }
  };

  const isCurrentUserSeller = (seller: string | undefined = '') => {
    return !!user && typeof seller === 'string' && seller.toLowerCase() === user.toLowerCase();
  };

  return (
    <Card
      title={<span style={{ color: "white" }}>Offer Address: <a href={`https://arbiscan.io/address/${offer.offerAddress}`} target="_blank" rel="noopener noreferrer" style={{color: '#6a5eff', textDecoration: 'underline'}}> {offer.offerAddress}</a></span>}
      style={{
        textAlign: "center",
        backgroundColor: darkerGrey,
        borderColor: borderGrey,
        color: "white"
      }}
      headStyle={{ borderBottom: `1px solid ${borderGrey}` }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ margin: "4px", fontSize: "20px" }}>CRX Balance: <span style={{ color: "#E0E0E0" }}>{Number(offer.cortexBalance)}</span></p>
        {offer.tokenWanted === usdcAddress ? (
          <p style={{ margin: "4px", fontSize: "20px" }}>Token To Pay: USDC<span style={{color: "#E0E0E0"}}></span></p>
        ) : (
          <p style={{ margin: "4px", fontSize: "20px" }}>Token To Pay: <span style={{color: "#E0E0E0"}}>{offer.tokenWanted}</span></p>
        )
        }
        <p style={{ margin: "4px", fontSize: "20px" }}>Amount: <span style={{color: "#E0E0E0"}}>{Number(offer.amountWanted.toString()) / 10 ** 6}</span></p>
        <p style={{ margin: "4px", fontSize: "20px" }}>$ per CRX: <span style={{color: "#E0E0E0"}}>${(offer.amountWanted/ 10** 6 / offer.cortexBalance).toFixed(3)}</span></p>
      </div>
      <FillOffer offerAddress={offer.offerAddress} usdcAddress={offer.tokenWanted} amountUSDC={offer.amountWanted} />
      {isCurrentUserSeller(seller?.seller) ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
          {isSuccess ? (
            <p style={{ color: "red" }}>Offer cancelled</p> 
          ) : 
            <Button loading={isLoading}type="primary" onClick={handleCancel} style={{ backgroundColor: "red", borderColor: "red" }} disabled={isCanceling}>{isCanceling ? 'Canceling...' : 'Cancel Offer'}</Button>
          }
        </div>
      ) : null}
    </Card>
  );
};


export default OfferList;
