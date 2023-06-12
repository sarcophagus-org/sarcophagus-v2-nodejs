import dotenv from "dotenv";
import { NodeSarcoClient } from "sarcophagus-v2-sdk";
dotenv.config();

const privateKey = process.env.PRIVATE_KEY ?? "";
const providerUrl = process.env.PROVIDER_URL ?? "";
console.log("🚀 ~ file: index.ts:7 ~ providerUrl:", providerUrl);

const sarco = new NodeSarcoClient({ privateKey, providerUrl });

// console.log(sarco);
