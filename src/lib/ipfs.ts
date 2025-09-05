import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Uploads a JSON object to IPFS via Pinata.
 * @param data The JSON data to upload.
 * @param name An optional name for the file on Pinata.
 * @returns The IPFS hash (CID) of the uploaded content.
 */
export const uploadToPinata = async (data: object, name?: string): Promise<string> => {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error("Pinata API Key or Secret Key is not set in .env.local");
  }

  const payload = {
    pinataContent: data,
    pinataMetadata: {
      name: name || `SonicVote Election Data - ${new Date().toISOString()}`,
    },
  };

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    }
  );

  return response.data.IpfsHash;
};

/**
 * Fetches a JSON file from IPFS via Pinata's public gateway.
 * @param ipfsHash The IPFS hash (CID) of the content to fetch.
 * @returns The JSON data from IPFS.
 */
export const fetchFromIPFS = async (ipfsHash: string): Promise<any> => {
  const url = `${PINATA_GATEWAY}${ipfsHash}`;
  const response = await axios.get(url);
  return response.data;
};