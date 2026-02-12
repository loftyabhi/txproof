# TxProof API & Webhook Integration Guide

Dear Partners and Developers,

This guide provides technical specifications for integrating with the TxProof API and Webhook systems. We have updated our protocol to improve security and reliability. Please ensure your applications are updated to match these specifications.

---

## 1. Authentication
All requests to the TxProof API must be authenticated using an API Key.

**Headers:**
- `X-API-Key`: Your secure API key (recommended)
- `Authorization`: `Bearer <YOUR_API_KEY>` (alternative)

> [!IMPORTANT]
> Keep your API keys secure. If you suspect a compromise, rotate them immediately in your dashboard.

---

## 2. API Reference

### Create PDF Generation Job
`POST /api/v1/bills/resolve`

Submit a transaction hash and chain ID to generate a cryptographic proof/receipt.

**Request Body (JSON):**
```json
{
  "txHash": "0x...",       // 64-character hex string starting with 0x
  "chainId": 8453,         // Integer (e.g., 8453 for Base Mainnet)
  "connectedWallet": "0x..." // Optional: User's wallet address
}
```

**Response (202 Accepted):**
```json
{
  "ok": true,
  "jobId": "job_12345",
  "status": "pending",
  "statusUrl": "https://api.txproof.xyz/api/v1/bills/job/job_12345"
}
```

### Check Job Status
`GET /api/v1/bills/job/:jobId`

**Response (JSON):**
```json
{
  "id": "job_12345",
  "state": "completed", // pending | processing | completed | failed
  "result": {
    "billDataUrl": "https://.../receipts/BILL-8453-23425234-0x12a3.json",
    "pdfPath": "/api/v1/pdfs/BILL-8453-23425234-0x12a3",
    "duration_ms": 1250
  },
  "data": "https://.../receipts/BILL-8453-23425234-0x12a3.json", // Direct Storage URL
  "error": null,
  "queuePosition": 0,
  "estimatedWaitMs": 0
}
```

---

## 3. Transaction Data (JSON Storage)
To optimize performance and save bandwidth, TxProof provides a direct URL to the full transaction data stored in Supabase Storage.

| Field | Type | Description |
| :--- | :--- | :--- |
| `billDataUrl` / `data` | String (URL) | Public link to the full JSON proof. Download this file to access detailed transaction metrics. |
| `pdfPath` | String (Path) | Path to the printable version of the receipt. |

> [!TIP]
> Your application should download the JSON from `data` URL only when you need to process the full transaction details.

---

## 4. Webhooks & Security
Webhooks allow your application to receive real-time updates.

### Webhook Payload Structure
When an event occurs, TxProof sends a `POST` request to your configured URL.

**Success Payload (`bill.completed`):**
```json
{
  "event_type": "bill.completed",
  "data": {
    "bill_id": "BILL-8453-...",
    "transaction_hash": "0x...",
    "chain_id": 8453,
    "status": "completed",
    "duration_ms": 1250,
    "txHash": "0x...",
    "billId": "BILL-8453-...",
    "billDataUrl": "https://.../receipts/BILL-8453-....json"
  },
  "id": "evt_0x..._bill.completed",
  "timestamp": 1739311200
}
```

> [!TIP]
> Use the `bill_id` from the webhook to fetch the full `billData` schema from the API if required for your database.


### Signature Verification
To ensure requests are coming from TxProof, you **must** verify the `X-TxProof-Signature` header.

**Verification Algorithm:**
1. Retrieve the signature header (Format: `t=TIMESTAMP,v1=SIGNATURE`).
2. Extract the `TIMESTAMP` and the `SIGNATURE`.
3. Concatenate the timestamp and the **canonical JSON string** of the request body with a dot: `TIMESTAMP.CANONICAL_JSON_BODY`.
4. Compute the HMAC-SHA256 hash of this string using your Webhook Secret.
5. Compare the computed signature with the one received in the header.

> [!WARNING]
> We use **RFC 8785 (Canonical JSON)**. Ensure your verification logic handles key ordering and spacing exactly as specified to avoid signature mismatches.

---

## 4. Quota and Rate Limits
Every API request consumes your monthly quota based on your plan.

**Response Headers:**
- `X-Quota-Limit`: Your total monthly limit.
- `X-Quota-Used`: Quota consumed this month.
- `X-Quota-Remaining`: Remaining allowance.

If you exceed your quota, the API will return a `429 Too Many Requests` status.

---

## 5. Troubleshooting Common Issues
- **Signature Mismatch**: Ensure you are using the raw request body and a canonicalization library before signing.
- **Invalid txHash**: Ensure the hash is exactly 66 characters (0x + 64 hex characters).
- **HTTPS Only**: All webhook URLs must use HTTPS.

For further assistance, please contact our technical support.
