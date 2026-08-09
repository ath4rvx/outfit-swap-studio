import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(express.json({ limit: "35mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "outfit-swap-studio" });
});

app.post("/api/outfit-swap", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Server is missing OPENAI_API_KEY. Add it to your hosting environment."
      });
    }

    const { personImage, outfitImage } = req.body || {};
    if (!isDataImage(personImage) || !isDataImage(outfitImage)) {
      return res.status(400).json({
        error: "Please upload a valid person photo and outfit reference."
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are editing the first image, which is the PERSON PHOTO.
The second image is an OUTFIT REFERENCE.

Replace ONLY the person's clothing with the clothing shown in the outfit reference.
Preserve the person's identity and facial geometry, facial expression, hairstyle, skin tone,
body proportions, pose, hands, legs, camera perspective, lighting direction, and background.
Do not copy the reference person's face, body, pose, or background.

Accurately reproduce the reference outfit's visible design: garment type, colors, material,
patterns, neckline, sleeves, straps, closures, trims and silhouette. Adapt the clothing naturally
to the person's existing pose and anatomy. Add realistic fabric folds, seams, contact shadows,
occlusion and lighting. Do not reshape, slim, enlarge, beautify, or otherwise alter the person's
body or face.

The final result should look like a natural, photorealistic photograph, not a collage.
Return only the finished edited image.
`;

    const response = await openai.responses.create({
      model: "gpt-5.5",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: personImage, detail: "high" },
          { type: "input_image", image_url: outfitImage, detail: "high" }
        ]
      }],
      tools: [{
        type: "image_generation",
        model: "gpt-image-1.5",
        action: "edit",
        input_fidelity: "high",
        quality: "high",
        size: "auto",
        output_format: "png"
      }],
      tool_choice: { type: "image_generation" }
    });

    const call = response.output?.find(
      item => item.type === "image_generation_call" && item.result
    );

    if (!call?.result) {
      console.error("Image generation returned no result:", JSON.stringify(response));
      return res.status(502).json({
        error: "The image service did not return an edited image."
      });
    }

    res.json({ image: `data:image/png;base64,${call.result}` });
  } catch (error) {
    console.error("OUTFIT_SWAP_ERROR", error);
    res.status(500).json({
      error: error?.message || "Could not generate the outfit swap."
    });
  }
});

function isDataImage(value) {
  return typeof value === "string" &&
    /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value) &&
    value.length < 18_000_000;
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Outfit Swap Studio listening on port ${port}`);
});
app.use(express.static(path.join(__dirname, "public")));app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
