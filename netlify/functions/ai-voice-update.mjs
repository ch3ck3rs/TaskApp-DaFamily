import { GoogleGenAI, Type } from "@google/genai";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A brief 1-sentence friendly summary of the proposed changes."
    },
    actions: {
      type: Type.ARRAY,
      description: "List of task operations to perform on the Honey-Do list.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ["add", "update", "complete", "uncomplete", "delete"]
          },
          targetTaskId: { type: Type.STRING },
          title: { type: Type.STRING },
          assignee: {
            type: Type.STRING,
            enum: ["DaDad", "Momma", "Porkchop", "Unassigned"]
          },
          category: {
            type: Type.STRING,
            enum: ["Repairs", "Errands", "Yard & Garage", "Cleaning", "Shopping", "Other"]
          },
          priority: {
            type: Type.STRING,
            enum: ["High", "Medium", "Low"]
          },
          doToday: { type: Type.BOOLEAN },
          notes: { type: Type.STRING }
        },
        required: ["type"]
      }
    }
  },
  required: ["summary", "actions"]
};

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI();

    const { transcript, audioBase64, mimeType, currentTasks } = await req.json();

    const promptText = `You are a helpful household task assistant for a family whose members are DaDad, Momma, and Porkchop.
Analyze the user's voice note or text brain-dump alongside their EXISTING TASKS below, and return structured bulk actions.

Rules:
1. Match existing tasks by ID whenever the user says to complete, check off, delete, remove, reassign, or move an existing task to/from "Today's Attack List" ("today pile", "do today").
2. If the user mentions new tasks, emit "add" actions with clean, capitalized titles.
3. Map any mention of "Dad" to "DaDad", "Mom"/"Mama" to "Momma", and "Porkchop" to "Porkchop". Default to "Unassigned" if unclear.
4. Set "doToday": true if the user says to put it on today's list, do it today, or attack it today.

EXISTING TASKS (JSON):
${JSON.stringify(currentTasks || [])}

${transcript ? `USER TRANSCRIPT:\n"${transcript}"` : "Listen to the attached audio recording and extract all requested task updates."}`;

    const contents = [];
    // Only send raw audio if browser speech-to-text didn't already capture a transcript (keeps response under 2 seconds)
    if (!transcript && audioBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: audioBase64,
          mimeType
        }
      });
    }
    contents.push(promptText);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1
      }
    });

    const parsed = JSON.parse(response.text);
    return Response.json(parsed);
  } catch (err) {
    console.error("AI Voice Update Error:", err);
    return Response.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
};
