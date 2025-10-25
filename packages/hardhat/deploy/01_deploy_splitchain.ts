import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the SplitChain contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deploySplitChain: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("SplitChain", {
    from: deployer,
    // Contract constructor arguments (SplitChain has none)
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying
  const splitChain = await hre.ethers.getContract<Contract>("SplitChain", deployer);
  console.log("👋 SplitChain deployed successfully!");
  console.log("📝 Contract address:", await splitChain.getAddress());
};

export default deploySplitChain;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags SplitChain
deploySplitChain.tags = ["SplitChain"];
