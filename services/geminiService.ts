import { GoogleGenAI } from "@google/genai";
import { Client, Visit } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateClientProfile = async (client: Client, visits: Visit[]): Promise<string> => {
  const visitNotes = visits
    .filter(v => v.clientId === client.id)
    .map(v => `- ${v.date} (${v.type}): ${v.notes}`)
    .join('\n');

  const prompt = `
    Aja como um consultor sênior de vendas de TI da "Ribeiro, Lda." em Tete, Moçambique.
    Analise os dados deste cliente e o histórico de visitas para traçar um perfil e identificar oportunidades de venda.
    
    Cliente: ${client.name}
    Área: ${client.area}
    Categoria: ${client.category}
    Classificação Atual: ${client.classification}
    Focal Point: ${client.contactPerson} (${client.contactRole})
    
    Histórico de Visitas:
    ${visitNotes}
    
    Tarefas:
    1. Resuma o perfil tecnológico potencial da empresa baseada na categoria e área.
    2. Identifique "lacunas" (gaps) onde a Ribeiro Lda pode oferecer serviços (Redes, CCTV, Suporte, Software, Hardware).
    3. Sugira uma estratégia para a próxima abordagem.
    
    Mantenha a resposta concisa, profissional e formatada em tópicos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Não foi possível gerar o perfil.";
  } catch (error) {
    console.error("Erro ao conectar com Gemini:", error);
    return "Erro ao gerar análise. Verifique sua conexão ou chave de API.";
  }
};