/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  BaseMultichain,
  BaseMultichainInterface,
} from "../../../../../contracts/messaging/connectors/multichain/BaseMultichain";

const _abi = [
  {
    inputs: [],
    name: "ProposedOwnable__onlyOwner_notOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "ProposedOwnable__onlyProposed_notProposedOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "ProposedOwnable__ownershipDelayElapsed_delayNotElapsed",
    type: "error",
  },
  {
    inputs: [],
    name: "ProposedOwnable__proposeNewOwner_invalidProposal",
    type: "error",
  },
  {
    inputs: [],
    name: "ProposedOwnable__proposeNewOwner_noOwnershipChange",
    type: "error",
  },
  {
    inputs: [],
    name: "ProposedOwnable__renounceOwnership_invalidProposal",
    type: "error",
  },
  {
    inputs: [],
    name: "ProposedOwnable__renounceOwnership_noProposal",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_previous",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_updated",
        type: "uint256",
      },
    ],
    name: "GasCapUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "proposedOwner",
        type: "address",
      },
    ],
    name: "OwnershipProposed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "acceptProposedOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "anyExecute",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
      {
        internalType: "bytes",
        name: "result",
        type: "bytes",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "delay",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newlyProposed",
        type: "address",
      },
    ],
    name: "proposeNewOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "proposed",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proposedTimestamp",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounced",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_gasCap",
        type: "uint256",
      },
    ],
    name: "setGasCap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class BaseMultichain__factory {
  static readonly abi = _abi;
  static createInterface(): BaseMultichainInterface {
    return new utils.Interface(_abi) as BaseMultichainInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BaseMultichain {
    return new Contract(address, _abi, signerOrProvider) as BaseMultichain;
  }
}
