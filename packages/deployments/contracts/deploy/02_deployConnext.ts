import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, Facet } from "hardhat-deploy/types";
import { constants, Contract, providers, utils, Wallet } from "ethers";
import { FunctionFragment, Interface } from "ethers/lib/utils";
import { FacetCut, FacetCutAction, ExtendedArtifact, DeploymentSubmission } from "hardhat-deploy/dist/types";
import { mergeABIs } from "hardhat-deploy/dist/src/utils";

import { SKIP_SETUP } from "../src/constants";
import { getConnectorName, getDeploymentName, getProtocolNetwork, getRelayerProxyConfig } from "../src/utils";
import { chainIdToDomain } from "../src";
import { MESSAGING_PROTOCOL_CONFIGS } from "../deployConfig/shared";

type FacetOptions = {
  name: string;
  contract: string;
  args?: any[];
  deterministic?: boolean | string;
};

const proposeDiamondUpgrade = async (
  facets: FacetOptions[],
  hre: HardhatRuntimeEnvironment,
  deployer: Wallet,
): Promise<{ cuts: FacetCut[]; tx: undefined | providers.TransactionResponse; abi: undefined | any[] }> => {
  // Get existing facets + selectors
  const existingDeployment = (await hre.deployments.getOrNull(getDeploymentName("Connext")))!;
  const contract = new Contract(existingDeployment.address, existingDeployment?.abi, deployer);

  // Make sure this isnt a duplicate proposal (i.e. you aren't just resetting times)
  const initFix = await hre.deployments.deploy("DiamondInitFix", {
    contract: "DiamondInitFix",
    args: [],
    from: deployer.address,
    log: true,
    deterministicDeployment: true,
  });
  const facetCuts: FacetCut[] = [];
  facetCuts.push({
    facetAddress: initFix.address,
    functionSelectors: ["0xe1c7392a"],
    action: FacetCutAction.Add,
  });
  const initFunc = new utils.Interface(initFix.abi).encodeFunctionData("init", []);
  const acceptanceTime = await contract.getAcceptanceTime(facetCuts, initFix.address, initFunc);
  if (!acceptanceTime.isZero()) {
    console.log(`cut has already been proposed`);
    return { cuts: facetCuts, tx: undefined, abi: undefined };
  }
  console.log("calling propose");

  // Propose facet cut
  return {
    cuts: facetCuts,
    tx: await contract.proposeDiamondCut(facetCuts, initFix.address, initFunc),
    abi: undefined,
  };
};

/**
 * Hardhat task defining the contract deployments for nxtp
 *
 * @param hre Hardhat environment to deploy to
 */
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  const chainId = await hre.getChainId();

  const acceptanceDelay = 0; // 604800 = 7 days

  let _deployer: any;
  ({ deployer: _deployer } = await hre.ethers.getNamedSigners());
  if (!_deployer) {
    [_deployer] = await hre.ethers.getUnnamedSigners();
  }
  const deployer = _deployer as Wallet;
  console.log("\n============================= Deploying Connext Contracts ===============================");
  console.log("deployer: ", deployer.address);

  const network = await hre.ethers.provider.getNetwork();
  console.log("network: ", network);
  const domain = chainIdToDomain(network.chainId);
  console.log("domain: ", domain);
  const price = await hre.ethers.provider.getGasPrice();
  console.log("price: ", price.toString());

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("balance: ", balance.toString());

  // Get connector manager
  const messagingNetwork = getProtocolNetwork(chainId);
  const protocol = MESSAGING_PROTOCOL_CONFIGS[messagingNetwork];

  if (!protocol.configs[protocol.hub]) {
    throw new Error(`Network ${messagingNetwork} is not supported! (no messaging config)`);
  }

  const connectorName = getConnectorName(protocol, +chainId);
  const connectorManagerDeployment = await hre.deployments.getOrNull(
    getDeploymentName(connectorName, undefined, protocol.configs[Number(chainId)].networkName),
  );
  if (!connectorManagerDeployment) {
    throw new Error(`${connectorName} not deployed`);
  }

  const lpTokenDeployment = await hre.deployments.deploy("LPToken", {
    from: deployer.address,
    log: true,
    skipIfAlreadyDeployed: true,
  });

  if (lpTokenDeployment.newlyDeployed) {
    await hre.deployments.execute(
      "LPToken",
      { from: deployer.address, log: true },
      "initialize",
      "Nxtp Stable LP Token",
      "NxtpStableLPToken",
    );
  }

  // Deploy connext diamond contract
  console.log("Deploying connext diamond...");
  const isDiamondUpgrade = !!(await hre.deployments.getOrNull(getDeploymentName("Connext")));

  const facets: FacetOptions[] = [
    { name: getDeploymentName("TokenFacet"), contract: "TokenFacet", args: [] },
    { name: getDeploymentName("BridgeFacet"), contract: "BridgeFacet", args: [] },
    { name: getDeploymentName("InboxFacet"), contract: "InboxFacet", args: [] },
    { name: getDeploymentName("ProposedOwnableFacet"), contract: "ProposedOwnableFacet", args: [] },
    { name: getDeploymentName("RelayerFacet"), contract: "RelayerFacet", args: [] },
    { name: getDeploymentName("RoutersFacet"), contract: "RoutersFacet", args: [] },
    { name: getDeploymentName("StableSwapFacet"), contract: "StableSwapFacet", args: [] },
    { name: getDeploymentName("SwapAdminFacet"), contract: "SwapAdminFacet", args: [] },
    { name: getDeploymentName("DiamondCutFacet"), contract: "DiamondCutFacet", args: [] },
    { name: getDeploymentName("DiamondInit"), contract: "DiamondInit", args: [] },
    { name: getDeploymentName("DiamondInitFix"), contract: "DiamondInitFix", args: [] },
  ];
  let connext;
  if (isDiamondUpgrade) {
    console.log("proposing upgrade...");

    connext = (await hre.deployments.getOrNull(getDeploymentName("Connext")))!;

    const { cuts, tx: proposalTx, abi } = await proposeDiamondUpgrade(facets, hre, deployer);
    if (!proposalTx || !cuts.length) {
      console.log(`No upgrade needed, using previous deployment`);
    } else {
      console.log(`Proposal tx:`, proposalTx.hash);
      const receipt = await proposalTx.wait();
      console.log(`Upgrade to diamond proposed`, receipt.transactionHash);
    }

    // Fallthrough after proposal, will either work or fail depending on delay
    try {
      if (cuts.length) {
        const initFix = (await hre.deployments.getOrNull(getDeploymentName("DiamondInitFix")))!;
        const initFunc = new utils.Interface(initFix.abi).encodeFunctionData("init", []);

        const contract = new Contract(connext.address, connext.abi, deployer);
        const acceptanceTime = (await contract.getAcceptanceTime(cuts, initFix.address, initFunc)).toNumber();
        const currentTimeStamp = Math.floor(Date.now() / 1000);
        if (acceptanceTime > currentTimeStamp) {
          console.log(`delay not elapsed. still wait for ${acceptanceTime - currentTimeStamp} sec`);
        } else {
          const upgradeTx = await contract.diamondCut(cuts, initFix.address, initFunc);
          console.log("upgrade transaction", upgradeTx.hash);
          const receipt = await upgradeTx.wait();
          console.log("upgrade receipt", receipt);

          // Save updated abi to Connext Deployment
          const diamondDeployment: DeploymentSubmission = {
            ...connext,
            abi: abi ?? connext.abi,
          };

          await hre.deployments.save(getDeploymentName("Connext"), diamondDeployment);
          console.log("upgraded abi");
        }
      }
    } catch (e: any) {
      console.log(`upgrade failed`, e);
    }
  } else {
    connext = await hre.deployments.diamond.deploy(getDeploymentName("Connext"), {
      from: deployer.address,
      owner: deployer.address,
      log: true,
      facets,
      diamondContract: "ConnextDiamond",
      defaultOwnershipFacet: false,
      defaultCutFacet: false,
      execute: isDiamondUpgrade
        ? undefined
        : {
            contract: "DiamondInit",
            methodName: "init",
            args: [domain, connectorManagerDeployment.address, acceptanceDelay, lpTokenDeployment.address],
          },
    });
  }

  const connextAddress = connext.address;
  console.log("connextAddress: ", connextAddress);

  console.log("Deploying Relayer Proxy...");

  const { feeCollector, gelatoRelayer } = getRelayerProxyConfig(chainId);
  const spokeConnector = await hre.ethers.getContract(
    getDeploymentName(getConnectorName(protocol, +chainId), undefined, protocol.configs[Number(chainId)].networkName),
  );

  if (protocol.hub === network.chainId) {
    const rootManager = await hre.ethers.getContract(getDeploymentName("RootManager"));
    const relayerProxyHub = await hre.deployments.deploy(getDeploymentName("RelayerProxyHub"), {
      from: deployer.address,
      log: true,
      contract: "RelayerProxyHub",
      args: [connextAddress, spokeConnector.address, gelatoRelayer, feeCollector, rootManager.address],
    });

    console.log("relayerProxyHub: ", relayerProxyHub.address);
  } else {
    const relayerProxy = await hre.deployments.deploy(getDeploymentName("RelayerProxy"), {
      from: deployer.address,
      log: true,
      contract: "RelayerProxy",
      args: [connextAddress, spokeConnector.address, gelatoRelayer, feeCollector],
    });

    console.log("relayerProxy: ", relayerProxy.address);
  }

  if (!SKIP_SETUP.includes(parseInt(chainId))) {
    console.log("Deploying test token on non-mainnet chain...");
    // Note: NOT using special token for staging envs
    let deployment = await hre.deployments.deploy("TestERC20", {
      from: deployer.address,
      log: true,
      skipIfAlreadyDeployed: true,
      args: ["Test Token", "TEST"],
    });
    console.log("TestERC20: ", deployment.address);

    deployment = await hre.deployments.deploy("TestAdopted", {
      contract: "TestERC20",
      from: deployer.address,
      log: true,
      skipIfAlreadyDeployed: true,
      args: ["Test Adopted", "TEST2"],
    });

    deployment = await hre.deployments.deploy("TestWETH", {
      contract: "TestERC20",
      from: deployer.address,
      log: true,
      skipIfAlreadyDeployed: true,
      args: ["Test Wrapped Ether", "TWETH"],
    });

    console.log("TestERC20: ", deployment.address);
  } else {
    console.log("Skipping test setup on chainId: ", chainId);
  }
};

export default func;

func.tags = ["Connext", "prod", "local", "mainnet"];
//func.dependencies = ["Messaging"];
