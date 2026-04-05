import { NatalChart, AIReport } from '@/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  error?: {
    message: string;
  };
}

export async function generateAIReport(
  chart: NatalChart,
  apiKey: string,
  onStream?: (chunk: string) => void
): Promise<AIReport> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `Você é um astrólogo profissional com décadas de experiência em interpretação de mapas astrais. 
Você escreve relatórios completos, detalhados e empáticos em português brasileiro.

Sua tarefa é analisar os dados astronômicos fornecidos e criar um relatório astrológico completo com as seguintes seções:

1. **Visão Geral da Personalidade** - Análise do Sol, Lua e Ascendente
2. **Planetas nos Signos** - Interpretação de cada planeta em seu signo
3. **Casas Astrológicas** - Onde cada área da vida está destacada
4. **Aspectos Principais** - Como os planetas se relacionam entre si
5. **Síntese e Conselhos** - Resumo e orientações práticas

Escreva de forma calorosa, profissional e inspiradora. Use linguagem acessível mas com profundidade.
Inclua insights psicológicos e espirituais quando apropriado.`,
    },
    {
      role: 'user',
      content: formatChartForAI(chart),
    },
  ];

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://astro-map.app',
        'X-Title': 'AstroMap',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.8,
        max_tokens: 4000,
        stream: !!onStream,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    // Handle streaming response
    if (onStream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onStream(content);
              }
            } catch {
              // Ignore parse errors for malformed lines
            }
          }
        }
      }

      return parseAIReport(fullContent);
    }

    // Handle non-streaming response
    const data: OpenRouterResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    return parseAIReport(content);
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw new Error('Falha ao gerar relatório. Verifique sua chave API.');
  }
}

function formatChartForAI(chart: NatalChart): string {
  const { birthData, planets, housesPlacidus, aspects, ascendant, mc } = chart;
  
  let result = `DADOS DO MAPA ASTRAL\n`;
  result += `====================\n\n`;
  result += `NOME: ${birthData.name}\n`;
  result += `DATA: ${birthData.date}\n`;
  result += `HORA: ${birthData.time}\n`;
  result += `LOCAL: ${birthData.location}\n`;
  result += `COORDENADAS: ${birthData.latitude.toFixed(4)}°, ${birthData.longitude.toFixed(4)}°\n\n`;
  
  result += `POSIÇÕES PLANETÁRIAS:\n`;
  result += `-`.repeat(50) + '\n';
  
  for (const planet of planets) {
    const retro = planet.retrograde ? ' (R)' : '';
    const degree = `${Math.floor(planet.degree)}°${Math.floor((planet.degree % 1) * 60)}'`;
    result += `${planet.name}: ${planet.sign} ${degree} (Casa ${planet.house})${retro}\n`;
  }
  
  result += `\nÂNGULOS PRINCIPAIS:\n`;
  result += `-`.repeat(50) + '\n';
  result += `Ascendente: ${getZodiacSign(ascendant)} ${formatDegree(ascendant % 30)}\n`;
  result += `Meio do Céu (MC): ${getZodiacSign(mc)} ${formatDegree(mc % 30)}\n`;
  
  result += `\nCÚSPIDES DAS CASAS (Sistema Placidus):\n`;
  result += `-`.repeat(50) + '\n';
  
  for (const house of housesPlacidus) {
    const degree = `${Math.floor(house.degree)}°${Math.floor((house.degree % 1) * 60)}'`;
    result += `Casa ${house.number}: ${house.sign} ${degree}\n`;
  }
  
  result += `\nASPECTOS PRINCIPAIS (órbita ≤ 8°):\n`;
  result += `-`.repeat(50) + '\n';
  
  const majorAspects = aspects.filter(a => 
    ['conjunction', 'sextile', 'square', 'trine', 'opposition'].includes(a.type)
  ).slice(0, 15); // Limitar aos 15 aspectos mais importantes
  
  for (const aspect of majorAspects) {
    const applying = aspect.applying ? ' aplicando' : ' separando';
    result += `${aspect.planet1} ${aspect.type} ${aspect.planet2} (órbita: ${aspect.orb.toFixed(1)}°${applying})\n`;
  }
  
  result += `\nPor favor, gere um relatório astrológico completo e detalhado baseado nestes dados.`;
  
  return result;
}

function parseAIReport(content: string): AIReport {
  // Tentar extrair seções do relatório
  const sections: { title: string; content: string }[] = [];
  
  // Dividir por headings markdown
  const lines = content.split('\n');
  let currentTitle = '';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,3}\s*)(.+)$/);
    
    if (headerMatch) {
      if (currentTitle && currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join('\n').trim(),
        });
      }
      currentTitle = headerMatch[2].trim();
      currentContent = [];
    } else if (line.trim()) {
      currentContent.push(line);
    }
  }
  
  // Adicionar última seção
  if (currentTitle && currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n').trim(),
    });
  }
  
  // Se não conseguiu extrair seções, criar uma seção única
  if (sections.length === 0) {
    sections.push({
      title: 'Relatório Astrológico',
      content: content.trim(),
    });
  }
  
  return {
    sections,
    summary: sections[0]?.content.slice(0, 200) + '...' || content.slice(0, 200) + '...',
    generatedAt: new Date().toISOString(),
  };
}

function getZodiacSign(longitude: number): string {
  const signs = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
  return signs[Math.floor(longitude / 30) % 12];
}

function formatDegree(degree: number): string {
  const d = Math.floor(degree);
  const m = Math.floor((degree - d) * 60);
  return `${d}°${m}'`;
}
