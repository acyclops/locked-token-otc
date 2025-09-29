import { ReactNode } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Address, parseAbi, formatUnits } from 'viem';

interface UserCrxBalanceProps {
  cortexAddress: Address;
  children: (data: [number, number]) => ReactNode; // [balance, totalBalance]
}

const chainId = 42161; // Arbitrum One

const abi = parseAbi([
  'function totalBalanceOf(address) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
]);

export default function UserCrxBalance({ cortexAddress, children }: UserCrxBalanceProps) {
  const { address } = useAccount(); // signer address

  // Avoid queries until we have an address
  const enabled = !!address;

  const { data: balance } = useReadContract({
    address: cortexAddress,
    abi,
    functionName: 'balanceOf',
    args: [address as Address],
    chainId,
    query: { enabled },
  });

  const { data: totalBalance } = useReadContract({
    address: cortexAddress,
    abi,
    functionName: 'totalBalanceOf',
    args: [address as Address],
    chainId,
    query: { enabled },
  });

  if (!enabled) return null;

  const balNum = balance ? Number(formatUnits(balance as bigint, 18)) : 0;
  const totalNum = totalBalance ? Number(formatUnits(totalBalance as bigint, 18)) : 0;

  return children([balNum, totalNum]);
}
