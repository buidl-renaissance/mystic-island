import FormData from "form-data";
import axios from "axios";

// Pinata IPFS configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY || "e5523ec6f4884aa69033";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud";

/**
 * Upload file to IPFS using Pinata
 * @param file Buffer of the file to upload
 * @param fileName Name of the file
 * @param contentType MIME type of the file (e.g., "image/jpeg", "video/mp4")
 * @returns IPFS hash
 */
export async function uploadToIPFS(
  file: Buffer,
  fileName: string,
  contentType?: string
): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error("Pinata API credentials not configured");
  }

  // Use form-data package for Node.js
  const formData = new FormData();

  // Append file buffer
  formData.append("file", file, {
    filename: fileName,
    contentType: contentType || "application/octet-stream",
  });

  // Append metadata as JSON string
  const metadata = JSON.stringify({
    name: fileName,
  });
  formData.append("pinataMetadata", metadata);

  // Append options as JSON string
  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append("pinataOptions", options);

  // Use axios which handles form-data better in Node.js
  const headers = {
    ...formData.getHeaders(),
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_KEY,
  };

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data || error.message;
      throw new Error(`Pinata upload failed: ${JSON.stringify(errorMessage)}`);
    }
    throw error;
  }
}

/**
 * Upload JSON metadata to IPFS
 * @param metadata JSON object to upload
 * @param metadataName Name for the metadata file
 * @returns IPFS hash
 */
export async function uploadMetadataToIPFS(
  metadata: Record<string, unknown>,
  metadataName: string = "metadata"
): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error("Pinata API credentials not configured");
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: metadataName,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata metadata upload failed: ${error}`);
  }

  const data = await response.json();
  return data.IpfsHash;
}

/**
 * Get IPFS gateway URL from hash
 */
export function getIpfsUrl(hash: string): string {
  return `${PINATA_GATEWAY}/ipfs/${hash}`;
}

/**
 * Get IPFS protocol URL from hash
 */
export function getIpfsProtocolUrl(hash: string): string {
  return `ipfs://${hash}`;
}

