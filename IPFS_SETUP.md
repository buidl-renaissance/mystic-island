# IPFS & AI Integration Setup

This guide explains how to set up IPFS image uploads and AI-generated metadata for artifacts.

## Required Services

### 1. Pinata (IPFS Storage)

Pinata is used to upload images and metadata to IPFS.

**Setup Steps:**
1. Sign up at https://www.pinata.cloud/
2. Create an API key:
   - Go to your account settings
   - Navigate to API Keys
   - Create a new key with `pinFileToIPFS` and `pinJSONToIPFS` permissions
3. Copy your API Key and Secret Key

**Environment Variables:**
```bash
PINATA_API_KEY=e5523ec6f4884aa69033
PINATA_SECRET_KEY=your_secret_key_here
PINATA_GATEWAY=https://gateway.pinata.cloud
```

### 2. OpenAI (AI Metadata Generation)

OpenAI is used to generate titles and descriptions from uploaded images.

**Setup Steps:**
1. Sign up at https://platform.openai.com/
2. Create an API key:
   - Go to API Keys section
   - Create a new secret key
3. Copy your API key

**Environment Variables:**
```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
```

**Note:** If OpenAI is not configured, the system will fall back to generic metadata:
- Title: "Mystic Artifact"
- Description: "A mysterious artifact from the Mystic Island realm."

## Environment Setup

### Option 1: Create `.env.local` file

Create a `.env.local` file in the root directory:

```bash
# Pinata (API key is already configured, but secret key is REQUIRED)
PINATA_SECRET_KEY=your_pinata_secret_key_here
PINATA_GATEWAY=https://gateway.pinata.cloud

# OpenAI (optional - for AI-generated metadata)
OPENAI_API_KEY=sk-your_openai_api_key_here
```

**Note:** The `PINATA_API_KEY` is already hardcoded in the API endpoint, but you must provide the `PINATA_SECRET_KEY` from your Pinata dashboard.

### Option 2: Set environment variables

```bash
export PINATA_API_KEY=e5523ec6f4884aa69033
export PINATA_SECRET_KEY=your_pinata_secret_key_here
export OPENAI_API_KEY=sk-your_openai_api_key_here
```

## How It Works

1. **User uploads image** via the ImageUpload component
2. **Image is uploaded to IPFS** via Pinata
3. **AI generates metadata** (title & description) from the image using OpenAI Vision API
4. **Metadata JSON is created** following ERC721 standard
5. **Metadata is uploaded to IPFS** via Pinata
6. **IPFS hash is returned** (e.g., `ipfs://Qm...`)
7. **Artifact is minted** with the IPFS metadata URI

## Metadata Format

The generated metadata follows the ERC721 metadata standard:

```json
{
  "name": "AI Generated Title",
  "description": "AI Generated Description",
  "image": "ipfs://Qm...",
  "external_url": "https://mysticisland.xyz",
  "attributes": [
    {
      "trait_type": "Type",
      "value": "Artifact"
    },
    {
      "trait_type": "Rarity",
      "value": "Common"
    }
  ]
}
```

## Testing

1. Start your development server:
   ```bash
   yarn dev
   ```

2. Navigate to `/join-tribe` or `/create-artifact`

3. Upload an image - you should see:
   - Image preview
   - Upload progress
   - AI-generated title and description
   - IPFS metadata URL

## Troubleshooting

### Error: "Pinata API credentials not configured"
- Make sure `PINATA_SECRET_KEY` is set in your environment variables
- Restart your development server after setting environment variables

### Error: "Failed to upload image"
- Check your Pinata API key and secret key
- Verify your Pinata account has sufficient credits
- Check network connectivity

### AI metadata not generating
- Check if `OPENAI_API_KEY` is set
- Verify your OpenAI account has credits
- The system will fall back to generic metadata if OpenAI fails

### Image too large
- Maximum file size is 10MB
- Supported formats: JPG, PNG, GIF

## Cost Considerations

### Pinata
- Free tier: 1GB storage, 1000 pins/month
- Paid plans available for higher usage

### OpenAI
- GPT-4 Vision API pricing: ~$0.01-0.03 per image
- Free tier available with limited usage

## Security Notes

- Never commit `.env.local` to version control
- Keep your API keys secure
- Use environment variables for all sensitive data
- Consider using a secrets management service for production

