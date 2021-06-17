import { getProfile } from '@/lib/utils/profile';
import axios from 'axios';
import { computed, inject, reactive, watch } from 'vue';
import { useQuery } from 'vue-query';
import { Web3Plugin, Web3ProviderSymbol } from './web3.plugin';
import { Web3Provider } from '@ethersproject/providers';

export default function useVueWeb3() {
  const {
    connectWallet,
    account,
    chainId,
    disconnectWallet,
    connector,
    provider,
    walletState
  } = inject(Web3ProviderSymbol) as Web3Plugin;

  const isWalletReady = computed(() => walletState.value === 'connected');

  const canLoadProfile = computed(
    () => account.value !== '' && chainId.value !== 0
  );

  const getProvider = () => new Web3Provider(provider.value as any);

  // TODO separate this out?
  const { isLoading: isLoadingProfile, data: profile } = useQuery(
    ['WEB3_PROFILE', { account, chainId }],
    () => getProfile(account.value, String(chainId.value)),
    reactive({
      enabled: canLoadProfile
    })
  );

  // TODO seperate this out?
  // load up a list of all the evm chains
  const { data: evmChains, isLoading: isLoadingEvmChains } = useQuery(
    'EVM_CHAINS',
    async () =>
      await (await axios.get('https://chainid.network/chains.json')).data
  );

  const networkName = computed(() => {
    if (!isLoadingEvmChains.value) {
      const chain = evmChains.value.find(
        chain => chain.networkId === chainId.value
      );
      return chain?.name || 'Unknown Network';
    }
    return 'Loading...';
  });

  return {
    connectWallet,
    account,
    chainId,
    getProvider,
    isLoadingProfile,
    profile,
    networkName,
    disconnectWallet,
    connector,
    provider,
    walletState,
    isWalletReady
  };
}
