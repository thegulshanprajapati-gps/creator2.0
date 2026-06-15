import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { verifyToken } from "@/lib/auth-token";
import { parseCookies } from "@/lib/csrf";
import { COOKIE_ACCESS_TOKEN } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const accessToken = cookies[COOKIE_ACCESS_TOKEN];

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenResult = verifyToken(accessToken, 'access');
    if (!tokenResult.valid) {
      return NextResponse.json({ error: "Session expired or invalid" }, { status: 401 });
    }

    const { certificateId, type } = await req.json();
    if (!certificateId || !type) {
      return NextResponse.json({ error: "Missing certificateId or type" }, { status: 400 });
    }

    const db = await getDb();
    
    // Find the certificate
    let cert = await db.collection("certificates").findOne({
      _id: (ObjectId.isValid(certificateId) ? new ObjectId(certificateId) : certificateId) as any
    });

    if (!cert) {
      cert = await db.collection("certificates").findOne({ certificateId });
      if (!cert) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
      }
    }
    
    return updateCert(cert, type, db);
  } catch (err: any) {
    console.error("Update type error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

async function updateCert(cert: any, type: string, db: any) {
  // Retrieve original test attempt
  const attempt = await db.collection("test_attempts").findOne({
    test_id: cert.examId,
    user_id: cert.studentId
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt details not found" }, { status: 404 });
  }

  // Load custom template from settings if present
  const settings = await db.collection("site_settings").findOne({}, { sort: { updated_at: -1 } });
  const templateBase64 = settings?.certificate_template || "";

  const certTitle = type === "participation" ? "CERTIFICATE OF PARTICIPATION" : "CERTIFICATE OF COMPLETION";

  // Create dynamic PDF certificate using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([800, 600]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  if (templateBase64 && templateBase64.startsWith("data:image/")) {
    try {
      const imageBytes = Buffer.from(templateBase64.split(",")[1], 'base64');
      let img;
      if (templateBase64.includes("image/png")) {
        img = await pdfDoc.embedPng(imageBytes);
      } else {
        img = await pdfDoc.embedJpg(imageBytes);
      }
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: 800,
        height: 600
      });
    } catch (err) {
      console.error("Failed to embed background template image:", err);
    }
  } else {
    // Draw border as fallback
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 5,
    });
  }

  // Write text
  page.drawText(certTitle, {
    x: 180,
    y: 480,
    size: 30,
    font,
    color: rgb(0.1, 0.2, 0.5),
  });

  page.drawText("This is proudly presented to", {
    x: 280,
    y: 390,
    size: 16,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(cert.studentName || "Valued Student", {
    x: 250,
    y: 320,
    size: 26,
    font,
    color: rgb(0.8, 0.2, 0.2),
  });

  page.drawText(`for successfully passing the assessment:`, {
    x: 230,
    y: 260,
    size: 14,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(cert.examTitle || "Skill Assessment", {
    x: 260,
    y: 210,
    size: 20,
    font,
    color: rgb(0.2, 0.6, 0.3),
  });

  page.drawText(`Certificate ID: ${cert.certificateId}`, {
    x: 50,
    y: 60,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Verification Key: ${cert.certificateId}`, {
    x: 50,
    y: 45,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  const base64Pdf = Buffer.from(pdfBytes).toString("base64");

  // Save changes
  await db.collection("certificates").updateOne(
    { _id: cert._id },
    { $set: { pdfData: base64Pdf, type } }
  );

  return NextResponse.json({ success: true });
}
