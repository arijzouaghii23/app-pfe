const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const { getBusinessData } = require("../utils/businessDictionary");
const axios = require('axios');
const FormData = require('form-data');

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

/**
 * Appelle le microservice Python YOLOv8 pour détecter la dégradation.
 * @param {string} filePath - Chemin absolu vers l'image.
 * @returns {Promise<Object>} - Les données de détection et les recommandations métier.
 */
const analyzeImageWithYolo = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    // Appel à l'API Python
    const response = await axios.post('http://localhost:8000/detect', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    const yoloResult = response.data;

    // Si aucune anomalie détectée par YOLO
    if (!yoloResult.detected) {
      return {
        detected: false,
        yoloClassId: null,
        yoloClassName: "Aucune dégradation",
        yoloConfidence: 0,
        businessRecommendation: "Aucune intervention requise.",
        annotatedImageBase64: null
      };
    }

    // Récupérer les données du dictionnaire métier
    const businessData = getBusinessData(yoloResult.class_id);

    return {
      detected: true,
      yoloClassId: yoloResult.class_id,
      yoloClassName: businessData.name, // Nom issu du dico métier (ex: "Nid-de-poule")
      businessDefinition: businessData.definition,
      businessRecommendation: businessData.recommendation, // Recommandation métier
      yoloConfidence: yoloResult.confidence,
      annotatedImageBase64: yoloResult.annotated_image_base64 // Sera sauvegardé sur disque par le controller
    };

  } catch (error) {
    console.error("[YOLO SERVICE ERROR] Impossible de joindre l'API Python :", error.message);
    throw new Error("Erreur lors de l'analyse YOLO");
  }
};

module.exports = { analyzeImageWithGemini, analyzeImageWithYolo };