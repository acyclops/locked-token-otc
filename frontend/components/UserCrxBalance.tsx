import { useState, useEffect } from 'react';
import { BigNumber } from 'ethers';
import { useContractRead, useSigner, Address } from 'wagmi';

interface UserCrxBalanceProps {
  cortexAddress: Address;
  children: (data: number[]) => React.ReactNode;
}

// const chain = 80001;
const chain = 42161;

const UserCrxBalance = ({ cortexAddress, children }: UserCrxBalanceProps) => {
  const [user, setUser] = useState('');
  const [userFetched, setUserFetched] = useState(false);
  const { data: signer } = useSigner();
  const decimals = BigNumber.from('1000000000000000000');

  useEffect(() => {
    if (signer) {
      signer.getAddress().then((address) => {
        setUser(address);
        setUserFetched(true);
      });
    }
  }, [signer]);

  const { data: totalBalance }: { data?: BigNumber } = useContractRead({
    address: cortexAddress,
    abi: ['function totalBalanceOf(address) public view returns (uint256)'],
    functionName: 'totalBalanceOf',
    args: [user],
    chainId: chain,
  });

  const { data: balance }: { data?: BigNumber } = useContractRead({
    address: cortexAddress,
    abi: ['function balanceOf(address) public view returns (uint256)'],
    functionName: 'balanceOf',
    args: [user],
    chainId: chain,
  });

  console.log("cum");

  return (
    userFetched && (balance && totalBalance && children([balance.div(decimals).toNumber() || 0, totalBalance.div(decimals).toNumber() || 0])) ?
      (<> {children([balance.div(decimals).toNumber() || 0, totalBalance.div(decimals).toNumber() || 0])} </>) :
      null
  );  
};

export default UserCrxBalance;
