import "dotenv/config";
import { ArchaeologistProfile, ChunkingUploader, NodeSarcoClient } from "sarcophagus-v2-sdk";
import { BigNumber, ethers } from "ethers";

const privateKey = process.env.PRIVATE_KEY ?? "";
const providerUrl = process.env.PROVIDER_URL ?? "";
const chainId = parseInt(process.env.CHAIN_ID) ?? 5;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY ?? "";

async function main() {
  const sarco = new NodeSarcoClient({ privateKey, providerUrl, chainId, etherscanApiKey });
  await sarco.init();
  const archsData = await sarco.archaeologist.getFullArchProfiles(undefined, true);
  const archs = archsData.slice(0, 5);

  await Promise.all(
    archs.map(async (arch) => {
      const connection = await sarco.archaeologist.dialArchaeologist(arch);
      arch.connection = connection;
    })
  );

  console.log("🚀 ~ file: index.ts:15 ~ main ~ archs:", archs);

  const [negotiationResult, negotiationTimestamp] =
    await sarco.archaeologist.initiateSarcophagusNegotiation(archs);

  const responses = archs.map((arch) => negotiationResult.get(arch.profile.peerId)!);
  console.log("🚀 ~ file: index.ts:24 ~ main ~ responses:", responses);

  const archPublicKeys = responses.map((response) => response.publicKey);

  //

  const payloadWallet = ethers.Wallet.createRandom();
  console.log("🚀 ~ file: index.ts:26 ~ main ~ payloadWallet:", payloadWallet);
  const recipientWallet = ethers.Wallet.createRandom();
  console.log("🚀 ~ file: index.ts:28 ~ main ~ recipientWallet:", recipientWallet);

  const testData = "Hello World!";
  const buffer = Buffer.from(testData, "utf-8");

  function onUploadChunk(chunkedUploader: ChunkingUploader, chunkedUploadProgress: number) {
    console.log("🚀 ~ file: index.ts:33 ~ main ~ chunkedUploadProgress:", chunkedUploadProgress);
  }

  function onUploadChunkError(msg: string) {
    console.log("🚀 ~ file: index.ts:37 ~ main ~ msg:", msg);
  }

  function onUploadComplete(uploadId: string) {
    console.log("Upload complete!");
    console.log("🚀 ~ file: index.ts:41 ~ main ~ uploadId:", uploadId);
  }

  const uploadArgs = {
    payloadData: {
      name: "hello_world.txt",
      type: "text/plain",
      data: buffer,
    },
    onStep: (step: string) => {
      console.log(step);
    },
    payloadPublicKey: payloadWallet.publicKey,
    payloadPrivateKey: payloadWallet.privateKey,
    recipientPublicKey: recipientWallet.publicKey,
    shares: 5,
    threshold: 3,
    archaeologistPublicKeys: archPublicKeys,
    onUploadChunk,
    onUploadChunkError,
    onUploadComplete,
  };
  console.log("🚀 ~ file: index.ts:47 ~ main ~ uploadArgs:", uploadArgs);
  await sarco.api.uploadFileToArweave(uploadArgs);

  // uploadAndSetArweavePayload
  // approveSarcoToken
  // submitSarcophagus
}

main();
