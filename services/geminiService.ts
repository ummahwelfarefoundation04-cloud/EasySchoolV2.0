import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateStudentSummary = async (studentData: any): Promise<string> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return "AI service unavailable: No API Key provided.";
  }

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Error generating student summary:", error);
    return "Error generating summary.";
  }
};