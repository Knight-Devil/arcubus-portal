import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

const key = process.env.GCP_KEY_FILE!;

const storage = key.startsWith("{")
  ? new Storage({ credentials: JSON.parse(key) })
  : new Storage({ keyFilename: key });
const bucketName = process.env.GCS_BUCKET_NAME!;

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType, metadata } = await req.json();

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    const finalContentType = contentType || "application/octet-stream";

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: finalContentType
    });

    // Attach metadata AFTER upload via separate step (important)
    // We'll encode metadata in filename OR pass headers

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}