import "dotenv/config";
import { BigNumber, ethers } from "ethers";
import { ChunkingUploader, NodeSarcoClient } from "sarcophagus-v2-sdk";

// Set up environment variables
// Be sure to define these in your .env
const privateKey = process.env.PRIVATE_KEY ?? "";
const providerUrl = process.env.PROVIDER_URL ?? "";
const chainId = parseInt(process.env.CHAIN_ID) ?? 5;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY ?? "";

async function main() {
  // Define parameters
  const sarcophagusName = "SDK Sarcophagus"; // the name of the sarcophagus
  const fileName = "hello_world.txt"; // the name of the file to upload
  const fileContents = "Hello World!"; // the contents of the file to upload
  const archaeologistCount = 5; // the number of archaeologists to use
  const requiredArchaeologistCount = 3; // the number of archaeologists required to resurrect
  const resurrectionTime = Date.now() + 1000 * 60 * 60 * 24 * 7; // the resurrection time in milliseconds

  // Create random wallets for the payload and recipient just for this example
  const payloadWallet = ethers.Wallet.createRandom();
  const recipientWallet = ethers.Wallet.createRandom();

  // 1. Initialize SDK
  const sarco = new NodeSarcoClient({ privateKey, providerUrl, chainId, etherscanApiKey });
  await sarco.init();

  // 2. Get archaeologist profiles
  const archsData = await sarco.archaeologist.getFullArchProfiles(undefined, true);
  // Pick whichever are returned first for this example
  const archs = archsData.slice(0, archaeologistCount);

  // 3. Dial and connect to archaeologists
  await Promise.all(
    archs.map(async (arch) => {
      const connection = await sarco.archaeologist.dialArchaeologist(arch);
      arch.connection = connection;
    })
  );

  // 4. Initiate sarcophagus negotiation
  const [negotiationResult, negotiationTimestamp] =
    await sarco.archaeologist.initiateSarcophagusNegotiation(archs);
  const responses = archs.map((arch) => negotiationResult.get(arch.profile.peerId)!);

  // 5. Upload file to Arweave
  const archPublicKeys = responses.map((response) => response.publicKey);

  function onStep(step: string) {}
  function onUploadChunk(chunkedUploader: ChunkingUploader, chunkedUploadProgress: number) {}
  function onUploadChunkError(msg: string) {}

  let uploadId = "";
  function onUploadComplete(_uploadId: string) {
    uploadId = _uploadId;
  }

  const buffer = Buffer.from(fileContents, "utf-8");
  const uploadArgs = {
    payloadData: {
      name: fileName,
      type: "text/plain",
      data: buffer,
    },
    onStep,
    payloadPublicKey: payloadWallet.publicKey,
    payloadPrivateKey: payloadWallet.privateKey,
    recipientPublicKey: recipientWallet.publicKey,
    shares: archaeologistCount,
    threshold: requiredArchaeologistCount,
    archaeologistPublicKeys: archPublicKeys,
    onUploadChunk,
    onUploadChunkError,
    onUploadComplete,
  };
  await sarco.api.uploadFileToArweave(uploadArgs);

  // 6. Approve SARCO token (this approves max amount)
  const approveAmount = BigNumber.from(ethers.constants.MaxUint256);
  await sarco.token.approve(approveAmount);

  // 7. Make contract call to create Sarcophagus
  const recipientState = {
    address: recipientWallet.address,
    publicKey: recipientWallet.publicKey,
    setByOption: null,
  };
  const selectedArchaeologists = archs;
  const requiredArchaeologists = requiredArchaeologistCount;

  const archPublicKeysMap = new Map<string, string>();
  archs.forEach((arch, i) => {
    archPublicKeysMap.set(arch.profile.archAddress, archPublicKeys[i]);
  });

  const archaeologistSignatures = new Map<string, string>();
  archs.forEach((arch, i) => {
    archaeologistSignatures.set(arch.profile.archAddress, responses[i].signature);
  });

  const { submitSarcophagusArgs } = sarco.utils.formatSubmitSarcophagusArgs({
    name: sarcophagusName,
    recipientState,
    resurrection: resurrectionTime,
    selectedArchaeologists,
    requiredArchaeologists,
    negotiationTimestamp,
    archaeologistPublicKeys: archPublicKeysMap,
    archaeologistSignatures,
    arweaveTxId: uploadId,
  });
  const tx = await sarco.api.createSarcophagus(...submitSarcophagusArgs);

  console.log("Successfully created Sarcophagus!");
  console.log("TX hash: ", tx.hash);
}

main();
