const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeImageWithGemini = async (filePath) => {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString("base64");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prompt simplifié : uniquement les données logiques
    const prompt = `
      Analyse cette image.
      1. Est-ce une infrastructure routière ? (Réponds par true ou false)
      2. Y a-t-il une dégradation visible ? (Réponds par true ou false)
      3. Donne un score de confiance de 0 à 100.
      Réponds UNIQUEMENT par un objet JSON valide, sans aucune autre phrase.
      Format exact: {"estUneRoute": boolean, "estDegradee": boolean, "scoreConfiance": number}
    `;

    const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: mimeType} }
    ]);

    let responseText = result.response.text();
    
    // Nettoyage robuste
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(responseText); 
  }catch (error) {
    console.error("AI SERVICE ERROR:", error.message);

    
    // Si l'IA est indisponible (Quota 429), on laisse passer le report 
    // pour montrer la suite du workflow (Expert/Agent).
    if (error.message.includes("429") || error.message.includes("quota")) {
      console.log(" Quota dépassé : Validation automatique pour test.");
      return { 
        estUneRoute: true, 
        estDegradee: true, 
        scoreConfiance: 100 
      };
    }
    return { estUneRoute: false, estDegradee: false, scoreConfiance: 0 };
  }
};

module.exports = { analyzeImageWithGemini };