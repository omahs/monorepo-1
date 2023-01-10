import Harbor from '@harbor-xyz/harbor';
import { Account, Balance, Contract, Chain, Log, OffChainActor, Testnet } from '@harbor-xyz/harbor/dist/harbor_sdk/types';
import { expect } from "chai";
import { getLastCommit } from 'git-last-commit';

export default function getTestnetName() {
  return new Promise((resolve, reject) => {
    getLastCommit((err, commit) => {
      if (err) {
        reject(err);
      } else {
        const testnetName = "sha-" + commit.hash.slice(0, 7);
        resolve(testnetName);
      }
    });
  });
}

describe('Harbor Test E2E', function () {

  let harbor: Harbor;
  let testnetName;
  let testnet: Testnet;

  before(async () => {
    let testnetName = await getTestnetName();

    harbor = new Harbor({
      userKey: "66t1DdSLuFnoAuVccZEkoN",
      projectKey: "xkfSjdSLuFnoAuVccX7j22"
    });
    await harbor.authenticate();
    if (typeof testnetName === 'string') {
      testnet = await harbor.testnet(testnetName);
    }
    console.log(testnetName);

  });

  it("Checks if the Testnet exists", async () => {
    console.log("\n\n==========testnet==========");
    console.log(testnet);

    expect(testnet.status).to.equal("RUNNING");
  });

  it("Checks if the Chains exists", async () => {
    const chains = testnet.chains();
    console.log(`\n\n==========chains(${chains.length})==========`);

    chains.forEach((chain) => {
      console.log(chain)
      expect(chain.status).to.equal("RUNNING");
      console.log(`${chain.chain} - ${chain.id} - ${chain.status} - ${chain.endpoint}`);
      chain.logs().then((logs) => {
        console.log(`\n\n==========chain logs==========`);
        logs.forEach((log) => {
          console.log(log);
        });
      }).catch((err) => {
        console.error(err);
      });
    })
  });

  it('Checks if the Offchain actors exists', async function () {
    const offChainActors = await testnet.offChainActors();
    console.log(`\n\n==========offChainActors(${offChainActors.length})==========`);
    console.log(offChainActors)
    offChainActors.forEach((actor) => {
      expect(actor.status).to.equal("RUNNING");
      console.log(`${actor.name} - ${actor.status} - ${actor.ports()} - ${actor.endpoint}`);
      actor.logs().then((logs) => {
        console.log(`\n\n==========logs for actor ${actor.name}==========`);
        logs.forEach((log) => {
          console.log(log);
        });
      });
    });

  });
});

