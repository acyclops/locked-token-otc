import React, { useEffect, useState } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { Address, formatUnits, parseAbi } from 'viem';
import { lensAbi } from '../lens-abi';
import FillOffer from './FillOffer';
import { Button, Card } from 'antd';
import { grey } from '@ant-design/colors';

const borderGrey = grey[9];
const darkerGrey = grey[6];

// Arbitrum One
const chainId = 42161;

interface Offer {
  offerAddress: Address;
  cortexBalance: number;       // human units (CRX, 18 decimals)
  tokenWanted: Address;
  amountWanted: number;        // human units (USDC, 6 decimals)
  pricePerCRX: number;
}

interface OfferItemProps {
  offer: Offer;
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

/** -------- Cancel helper (v2) ---------- */
const cancelAbi = parseAbi(['function cancel()']);

function useOfferCancellation(offerAddress: Address) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const cancel = () =>
    writeContract({
      address: offerAddress,
      abi: cancelAbi,
      functionName: 'cancel',
      args: [],
      chainId,
    });

  return { hash, cancel, isPending, error };
}

/** -------- Seller address reader (v2) ---------- */
const SellerAddress = ({ offerAddress, children }: SellerAddressProps) => {
  const { data: seller } = useReadContract({
    address: offerAddress,
    abi: parseAbi(['function seller() view returns (address)']),
    functionName: 'seller',
    args: [],
    chainId,
  });

  return <>{seller && children({ seller: seller as Address })}</>;
};

/** -------- Offer list (v2) ---------- */
const OfferList = ({ lensAddress, offerFactoryAddress, usdcAddress }: OfferListProps) => {
  // Current connected user
  const { address } = useAccount();
  const user = address ?? '';

  // Read all active offers from your Lens contract
  const { data: activeOffers, error } = useReadContract({
    address: lensAddress,
    abi: lensAbi as const,
    functionName: 'getAllActiveOfferInfo',
    args: [offerFactoryAddress],
    chainId,
  });

  if (error) return <p>Error: {String(error.message ?? error)}</p>;

  // Handle empty state
  // Expecting activeOffers to be an object like:
  // { offerAddresses: Address[], cortexBalances: bigint[], tokenWanted: Address[], amountWanted: bigint[] }
  const hasOffers =
    activeOffers &&
    (activeOffers as any).offerAddresses &&
    (activeOffers as any).offerAddresses.length > 0;

  if (!hasOffers) {
    return <p style={{ textAlign: 'center' }}>No active offers</p>;
  }

  const ao = activeOffers as unknown as {
    offerAddresses: Address[];
    cortexBalances: bigint[];
    tokenWanted: Address[];
    amountWanted: bigint[];
  };

  // Build and sort offers by $ per CRX
  const sortedOffers: Offer[] = ao.offerAddresses
    .map((addr, i) => {
      const cortexBalHuman = Number(formatUnits(ao.cortexBalances[i] ?? 0n, 18)); // CRX (18d)
      const amountUsdHuman = Number(formatUnits(ao.amountWanted[i] ?? 0n, 6));   // USDC (6d)
      const pricePerCRX =
        cortexBalHuman > 0 ? amountUsdHuman / cortexBalHuman : Number.POSITIVE_INFINITY;

      return {
        offerAddress: addr,
        cortexBalance: cortexBalHuman,
        tokenWanted: ao.tokenWanted[i],
        amountWanted: amountUsdHuman,
        pricePerCRX,
      };
    })
    .sort((a, b) => a.pricePerCRX - b.pricePerCRX);

  return (
    <div>
      <h2 style={{ color: 'white', textAlign: 'center' }}>Active Offers</h2>
      <p style={{ color: 'white', textAlign: 'center' }}>Sorted by $ per CRX</p>
      <ul style={{ display: 'grid', gap: '15px' }}>
        {sortedOffers.map((offer, index) => (
          <SellerAddress key={`${offer.offerAddress}-${index}`} offerAddress={offer.offerAddress}>
            {(seller) => (
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
};

/** -------- Individual offer card (v2) ---------- */
const OfferItem = ({ offer, onCancel, seller, user, usdcAddress }: OfferItemProps) => {
  const [isCanceling, setIsCanceling] = useState(false);

  const { hash: cancelHash, cancel, isPending: isCancelPending, error: cancelError } =
    useOfferCancellation(offer.offerAddress);

  const {
    isLoading: isCancelLoading,
    isSuccess: isCancelSuccess,
    error: cancelReceiptError,
  } = useWaitForTransactionReceipt({ hash: cancelHash });

  const handleCancel = async () => {
    try {
      setIsCanceling(true);
      cancel();
    } catch {
      setIsCanceling(false);
    }
  };

  useEffect(() => {
    if (isCancelSuccess) {
      setIsCanceling(false);
      onCancel?.();
    }
    if (cancelError || cancelReceiptError) {
      setIsCanceling(false);
    }
  }, [isCancelSuccess, cancelError, cancelReceiptError, onCancel]);

  const isCurrentUserSeller = (sellerAddr: string | undefined = '') =>
    !!user && typeof sellerAddr === 'string' && sellerAddr.toLowerCase() === String(user).toLowerCase();

  return (
    <Card
      title={
        <span style={{ color: 'white' }}>
          Offer Address:{' '}
          <a
            href={`https://arbiscan.io/address/${offer.offerAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#6a5eff', textDecoration: 'underline' }}
          >
            {offer.offerAddress}
          </a>
        </span>
      }
      style={{
        textAlign: 'center',
        backgroundColor: darkerGrey,
        borderColor: borderGrey,
        color: 'white',
      }}
      headStyle={{ borderBottom: `1px solid ${borderGrey}` }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ margin: '4px', fontSize: '20px' }}>
          CRX Balance: <span style={{ color: '#E0E0E0' }}>{offer.cortexBalance}</span>
        </p>

        {offer.tokenWanted === usdcAddress ? (
          <p style={{ margin: '4px', fontSize: '20px' }}>
            Token To Pay: <span style={{ color: '#E0E0E0' }}>USDC</span>
          </p>
        ) : (
          <p style={{ margin: '4px', fontSize: '20px' }}>
            Token To Pay: <span style={{ color: '#E0E0E0' }}>{offer.tokenWanted}</span>
          </p>
        )}

        <p style={{ margin: '4px', fontSize: '20px' }}>
          Amount:{' '}
          <span style={{ color: '#E0E0E0' }}>
            {offer.amountWanted}
          </span>
        </p>

        <p style={{ margin: '4px', fontSize: '20px' }}>
          $ per CRX:{' '}
          <span style={{ color: '#E0E0E0' }}>
            ${offer.pricePerCRX.toFixed(3)}
          </span>
        </p>
      </div>

      {/* Pass human USDC amount to FillOffer (your converted component expects human units) */}
      <FillOffer
        offerAddress={offer.offerAddress}
        usdcAddress={offer.tokenWanted}
        amountUSDC={offer.amountWanted}
      />

      {isCurrentUserSeller(seller?.seller) ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          {isCancelSuccess ? (
            <p style={{ color: 'red' }}>Offer cancelled</p>
          ) : (
            <Button
              loading={isCancelPending || isCancelLoading}
              type="primary"
              onClick={handleCancel}
              style={{ backgroundColor: 'red', borderColor: 'red' }}
              disabled={isCanceling || isCancelPending || isCancelLoading}
            >
              {isCancelPending || isCancelLoading ? 'Canceling…' : 'Cancel Offer'}
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
};

export default OfferList;
