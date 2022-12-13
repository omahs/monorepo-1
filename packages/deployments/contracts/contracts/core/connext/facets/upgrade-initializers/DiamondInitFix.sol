// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import {LibDiamond} from "../../libraries/LibDiamond.sol";
import {BaseConnextFacet} from "../BaseConnextFacet.sol";

// It is expected that this contract is customized if you want to deploy your diamond
// with data from a deployment script. Use the init function to initialize state variables
// of your diamond. Add parameters to the init funciton if you need to.

contract DiamondInitFix is BaseConnextFacet {
  // ============ External ============

  // You can add parameters to this function in order to pass in
  // data to set your own state variables
  // NOTE: not requiring a longer delay related to constant as we want to be able to test
  // with shorter governance delays
  function init() external {
    // ensure this is the owner
    LibDiamond.enforceIsContractOwner();

    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    ds.acceptanceDelay = 7 days;
  }
}
