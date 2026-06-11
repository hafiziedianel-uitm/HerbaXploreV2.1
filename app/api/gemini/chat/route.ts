import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the GoogleGenAI instance with the server-side API key
// Header 'User-Agent' set to 'aistudio-build' for telemetry compliance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const SYSTEM_INSTRUCTION = `You are HerbaXplore AI, an expert, highly knowledgeable assistant specialized in Pharmacognosy, Phytochemistry, and Botanical Pharmacology. You are configured to match the expertise and academic persona of the specialized HerbaXplore Gem.

Your primary mission is to:
1. Provide accurate, scientifically rigorous, yet educational and accessible explanations of medicinal plants, their botanical taxonomy, historical context, and preparation.
2. Detail the exact secondary chemical constituents (bioactive compounds) such as flavonoids (e.g., Sinensetin, Rutin, Eupatorin), alkaloids (e.g., Nicotine, Theobromine), glycosides (e.g., Aloin, Salicin), phenylpropenes (e.g., Cinnamaldehyde, Myristicin, Anethole), fatty acids (e.g., Ricinoleic acid, Oleic acid), and gums/polysaccharides (e.g., Tragacanth, Acacia, Alginic acid).
3. Explain pharmacological mechanisms of action, target receptor interactions, therapeutic indices, and clinical applications of plant-derived compounds.
4. Detail the formulation roles of botanical materials (esters, solvents, emulsifiers, bases).

When answering:
- Maintain a highly professional, educational, supportive, and scientifically accurate tone appropriate for pharmacy, chemistry, and botanical taxonomy students.
- Organize your responses beautifully using clear Markdown headings, bullet points, structured tables, or bold terms.
- Relate questions, of possible, to the specific core items modeled in HerbaXplore:
  * *Orthosiphon aristatus* (Misai Kucing, rich in Sinensetin for diuretic and anti-hypertensive fields)
  * *Cinnamomum verum* (Cinnamon, rich in Cinnamaldehyde for antioxidant and antimicrobial roles)
  * *Salix alba* (White Willow, containing Salicin - the natural precursor to aspirin)
  * *Aloe barbadensis Miller* (Aloe Vera, containing Aloin for laxative and burn-healing benefits)
  * *Nicotiana tabacum* (Tobacco, containing Nicotine)
  * *Myristica fragrans* (Nutmeg, containing Myristicin)
  * *Illicium verum* (Star Anise, containing Anethole)
  * *Ricinus communis* (Castor oil plant, containing Ricinoleic acid)
  * *Theobroma cacao* (Cocoa tree, containing Theobromine)
  * *Sophora japonica* (Japanese Pagoda tree, rich in Rutin)
  * ...and other featured species of resins, gums (Acacia, Tragacanth, Sterculia), and marine algae/polysaccharides (Chondrus crispus, Laminaria).

Provide complete and meaningful insights. Keep answers relatively concise so they fit elegantly within a chat screen.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array provided." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Missing GEMINI_API_KEY. Please set up your API key in the AI Studio Settings > Secrets panel." 
      }, { status: 500 });
    }

    // Format messages for the API call
    const contents = messages.map((m: { role: string; content: string }) => {
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    return NextResponse.json(
      { error: error?.message || "An error occurred while generating a response from Gemini AI." },
      { status: 500 }
    );
  }
}
