import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import type { Address } from 'viem';
import { formatUnits, parseAbi } from 'viem';
import { lensAbi } from '../lens-abi';
import FillOffer from './FillOffer';
import { Button, Card } from 'antd';
import { grey } from '@ant-design/colors';
import s from '../styles/OfferList.module.css';

const borderGrey = grey[9];
const darkerGrey = grey[6];

// const chainId = 42161; // Arbitrum one
const chainId = 421614; // Arbitrum sepolia 

interface Offer {
  offerAddress: Address;
  cortexBalance: number;
  tokenWanted: Address;
  amountWanted: number;
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
  children: ({ seller }: { seller: string | undefined }) => ReactElement;
}

interface OfferListProps {
  lensAddress: Address;
  offerFactoryAddress: Address;
  usdcAddress: Address;
}

// Cancel offer helper
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

// Helper to grab seller addy
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

const OfferList = ({ lensAddress, offerFactoryAddress, usdcAddress }: OfferListProps) => {
  // Current connected user
  const { address } = useAccount();
  const user = address ?? '';

  // Read all active offers from Lens
  const { data: activeOffers, error } = useReadContract({
    address: lensAddress,
    abi: lensAbi,
    functionName: 'getAllActiveOfferInfo',
    args: [offerFactoryAddress],
    chainId,
  });

  if (error) return <p>Error: {String(error.message ?? error)}</p>;

  // Handle empty state
  // activeOffers looks like:
  // { offerAddresses: Address[], cortexBalances: bigint[], tokenWanted: Address[], amountWanted: bigint[] }
  const hasOffers =
    activeOffers &&
    activeOffers[0] &&
    activeOffers[0].length >= 1;

  if (!hasOffers) {
    return <p className={s.centerText}>No active offers</p>;
  }

  const [
    offerAddresses = [],
    cortexBalances = [],
    tokenWanted = [],
    amountWanted = [],
  ] = (activeOffers ?? []) as [Address[], bigint[], Address[], bigint[]];

  // sort offers by $ per CRX
  const sortedOffers: Offer[] = offerAddresses
    .map((addr, i) => {
      const cortexBalHuman = Number(formatUnits(cortexBalances[i] ?? 0n, 18)); // CRX (18d)
      const amountUsdHuman = Number(formatUnits(amountWanted[i] ?? 0n, 6));   // USDC (6d)
      const pricePerCRX =
        cortexBalHuman > 0 ? amountUsdHuman / cortexBalHuman : Number.POSITIVE_INFINITY;

      return {
        offerAddress: addr,
        cortexBalance: cortexBalHuman,
        tokenWanted: tokenWanted[i],
        amountWanted: amountUsdHuman,
        pricePerCRX,
      };
    })
    .sort((a, b) => a.pricePerCRX - b.pricePerCRX);

  return (
    <div>
      <h2 className={s.headerTitle}>Active Offers</h2>
      <p className={s.subheaderTitle}>Sorted by $ per CRX</p>
      <ul className={s.gridList}>
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

// Single offer card
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
        <span className={s.cardTitle}>
          Offer Address:{' '}
          <a
            href={`https://sepolia.arbiscan.io/address/${offer.offerAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className={s.link}
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
      styles={{
        header: { borderBottom: `1px solid ${borderGrey}` }
      }}
    >
      <div className={s.centerCol}>
        <p className={s.row}>
          CRX Balance: <span className={s.muted}>{offer.cortexBalance}</span>
        </p>

        {offer.tokenWanted === usdcAddress ? (
          <p className={s.row}>
            Token To Pay: <span className={s.muted}>USDC</span>
          </p>
        ) : (
          <p className={s.row}>
            Token To Pay: <span className={s.muted}>{offer.tokenWanted}</span>
          </p>
        )}

        <p className={s.row}>
          Amount:{' '}
          <span className={s.muted}>
            {offer.amountWanted}
          </span>
        </p>

        <p className={s.row}>
          $ per CRX:{' '}
          <span className={s.muted}>
            ${offer.pricePerCRX.toFixed(3)}
          </span>
        </p>
      </div>

      <FillOffer
        offerAddress={offer.offerAddress}
        usdcAddress={offer.tokenWanted}
        amountUSDC={offer.amountWanted}
      />

      {isCurrentUserSeller(seller?.seller) ? (
        <div className={s.actions}>
          {isCancelSuccess ? (
            <p className={s.cancelled}>Offer cancelled</p>
          ) : (
            <Button
              loading={isCancelPending || isCancelLoading}
              type="primary"
              onClick={handleCancel}
              className={s.dangerBtn}
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
