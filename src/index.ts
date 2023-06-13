import 'dotenv/config'
import { SarcophagusState, WebSarcoClient, NodeSarcoClient } from "sarcophagus-v2-sdk";

const privateKey = process.env.PRIVATE_KEY ?? "";
const providerUrl = process.env.PROVIDER_URL ?? "";
console.log("🚀 ~ file: index.ts:7 ~ providerUrl:", providerUrl);

console.log(WebSarcoClient)

// const sarco = new NodeSarcoClient({ privateKey, providerUrl });

// console.log(sarco);
