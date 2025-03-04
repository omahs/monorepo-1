import { GelatoRelaySDK } from "@gelatonetwork/relay-sdk";
import {
  RelayerRequest,
  RelayerSyncFeeRequest,
  RelayResponse,
  RelayRequestOptions,
  axiosGet as _axiosGet,
  axiosPost as _axiosPost,
} from "@connext/nxtp-utils";

export const gelatoRelayWithSponsoredCall = (
  request: RelayerRequest,
  sponsorApiKey: string,
  options: RelayRequestOptions = {},
): Promise<RelayResponse> => {
  return GelatoRelaySDK.relayWithSponsoredCall(request, sponsorApiKey, options);
};

export const gelatoRelayWithSyncFee = (
  request: RelayerSyncFeeRequest,
  options: RelayRequestOptions = {},
): Promise<RelayResponse> => {
  return GelatoRelaySDK.relayWithSyncFee(request, options);
};

export const axiosGet = _axiosGet;

export const axiosPost = _axiosPost;

export const getEstimatedFee = GelatoRelaySDK.getEstimatedFee;
