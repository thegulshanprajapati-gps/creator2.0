import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const TEMP_DIR = path.join(process.cwd(), ".temp_ppt_conversions");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export async function convertPptxToPdfAndPng(
  fileData: string // base64 string, might have data: URI prefix
): Promise<{ pdfBase64: string; pngBase64: string }> {
  const base64Content = fileData.includes(",") ? fileData.split(",")[1] : fileData;
  const buffer = Buffer.from(base64Content, "base64");

  const id = Math.random().toString(36).substring(7);
  const pptxPath = path.join(TEMP_DIR, `temp_${id}.pptx`);
  const pdfPath = path.join(TEMP_DIR, `temp_${id}.pdf`);
  const pngPath = path.join(TEMP_DIR, `temp_${id}.png`);

  fs.writeFileSync(pptxPath, buffer);

  // PowerShell script to convert pptx to pdf and export slide 1 to png
  const psScript = `
$pptxPath = "${pptxPath.replace(/\\/g, "\\\\")}"
$pdfPath = "${pdfPath.replace(/\\/g, "\\\\")}"
$pngPath = "${pngPath.replace(/\\/g, "\\\\")}"

$pptx = New-Object -ComObject PowerPoint.Application
try {
  # Open(FileName, ReadOnly, Untitled, WithWindow)
  # ReadOnly = -1 (msoTrue), Untitled = 0 (msoFalse), WithWindow = 0 (msoFalse)
  $presentation = $pptx.Presentations.Open($pptxPath, -1, 0, 0)
  
  # SaveAs(FileName, FileType)
  # ppSaveAsPDF = 32
  $presentation.SaveAs($pdfPath, 32)
  
  # Export first slide to png
  $presentation.Slides.Item(1).Export($pngPath, "PNG")
  
  $presentation.Close()
} finally {
  $pptx.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($pptx) | Out-Null
  [System.GC]::Collect()
  [System.GC]::WaitForPendingFinalizers()
}
`;

  try {
    const scriptPath = path.join(TEMP_DIR, `convert_${id}.ps1`);
    fs.writeFileSync(scriptPath, psScript, "utf-8");

    // Execute script
    execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { stdio: "inherit" });

    // Read generated files
    if (!fs.existsSync(pdfPath) || !fs.existsSync(pngPath)) {
      throw new Error("Conversion failed. PDF or PNG file not generated.");
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pngBuffer = fs.readFileSync(pngPath);

    return {
      pdfBase64: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
      pngBase64: `data:image/png;base64,${pngBuffer.toString("base64")}`
    };
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
      const scriptPath = path.join(TEMP_DIR, `convert_${id}.ps1`);
      if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
    } catch (cleanupErr) {
      console.error("Temp file cleanup error:", cleanupErr);
    }
  }
}
