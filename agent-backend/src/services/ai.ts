export interface GeminiAttachment {
  mimeType: string;
  data: string;
}

export async function generateGeminiContent(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  temperature: number,
  history: any[],
  currentPrompt?: string,
  currentAttachment?: GeminiAttachment
): Promise<string> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
  
  const contents: any[] = []
  
  // Format previous history
  for (let i = 0; i < history.length; i++) {
    const msg = history[i]
    contents.push({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.message }]
    })
  }
  
  // Format current input
  const currentParts: any[] = [];
  if (currentPrompt) {
    currentParts.push({ text: currentPrompt });
  }
  if (currentAttachment) {
    currentParts.push({
      inlineData: {
        mimeType: currentAttachment.mimeType,
        data: currentAttachment.data
      }
    });
  }
  
  if (currentParts.length === 1 && currentAttachment) {
     currentParts.push({ text: "Tolong periksa gambar ini." })
  }
  
  if (currentParts.length > 0) {
    contents.push({ role: 'user', parts: currentParts })
  }

  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: contents,
      generationConfig: {
        temperature: temperature
      }
    })
  })

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text()
    console.error('Gemini API Error:', errorText)
    throw new Error('Gagal menghubungi Gemini API')
  }

  const geminiData = (await geminiResponse.json()) as any
  const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak bisa merespons saat ini.'
  
  return aiResponse
}
