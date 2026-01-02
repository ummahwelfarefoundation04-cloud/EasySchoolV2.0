
import { GoogleGenAI } from "@google/genai";

export const generateStudentSummary = async (studentData: any): Promise<string> => {
  // Check if API key is provided
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing.");
    return "AI service unavailable: No API Key provided.";
  }

  // Always create a new GoogleGenAI instance right before the API call to ensure it uses the current API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = `
      Based on the following student details, write a professional and concise "Admission Note" for the school records.
      Highlight key details like previous background, parents' occupation, and any specific needs if mentioned.
      
      Details:
      Name: ${studentData.firstName} ${studentData.lastName}
      Class: ${studentData.class}
      Previous School: ${studentData.previousSchoolName || 'N/A'}
      Father's Occupation: ${studentData.father?.occupation}
      Mother's Occupation: ${studentData.mother?.occupation}
      RTE Status: ${studentData.rte}
    `;

    // Generate content using gemini-3-flash-preview as recommended for basic text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly access the text property of the response as per extracting text guidelines.
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Error generating student summary:", error);
    return "Error generating summary.";
  }
};
