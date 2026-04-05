import { NextRequest, NextResponse } from 'next/server';
import { NatalChart, AIReport } from '@/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Modelos disponíveis
export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Rápido e econômico', cost: '~R$0.80/relatório' },
  { id: 'google/gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'O mais barato', cost: '~R$0.40/relatório' },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', description: 'Excelente em PT-BR', cost: '~R$0.50/relatório' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Maior qualidade', cost: '~R$2.00/relatório' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', description: 'Open source', cost: '~R$0.30/relatório' },
];

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { chart, model = 'google/gemini-2.5-flash', apiKey: clientApiKey, solarRevolution, solarYear } = await request.json();

    if (!chart) {
      return NextResponse.json(
        { error: 'Dados do mapa astral não fornecidos' },
        { status: 400 }
      );
    }

    // Usa a chave fornecida pelo cliente ou a variável de ambiente
    const apiKey = clientApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave API não fornecida. Insira sua chave da OpenRouter ou configure OPENROUTER_API_KEY no servidor.' },
        { status: 500 }
      );
    }

    // Se temos revolução solar, gerar relatório comparativo
    let messages: OpenRouterMessage[];
    
    if (solarRevolution && solarYear) {
      messages = buildSolarReturnPrompt(chart, solarRevolution, solarYear);
    } else {
      messages = buildNatalPrompt(chart);
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://astro-map.app',
        'X-Title': 'AstroMap',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || `Erro na API: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.error) {
      return NextResponse.json(
        { error: data.error.message },
        { status: 500 }
      );
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Resposta vazia da IA' },
        { status: 500 }
      );
    }

    const report = parseAIReport(content);
    
    return NextResponse.json({ 
      report, 
      modelUsed: model,
      type: solarRevolution ? 'solar-return' : 'natal'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function buildNatalPrompt(chart: NatalChart): OpenRouterMessage[] {
  return [
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
}

function buildSolarReturnPrompt(natalChart: NatalChart, solarReturn: NatalChart, year: number): OpenRouterMessage[] {
  return [
    {
      role: 'system',
      content: `Você é um astrólogo profissional especializado em revoluções solares e previsões anuais.
Você escreve análises detalhadas e práticas em português brasileiro.

Sua tarefa é comparar o mapa natal com a revolução solar e criar uma análise completa do ano incluindo:

1. **Visão Geral do Ano** - Temas principais baseados no Ascendente da revolução
2. **Comparação de Ascendentes** - Diferenças entre ASC natal e ASC da revolução
3. **Casa do Sol na Revolução** - Área de vida que ganha destaque este ano
4. **Lua na Revolução** - Tom emocional do ano
5. **Planetas Retrógrados** - Áreas que pedem revisão e reflexão
6. **Aspectos Importantes** - Conexões entre planetas da revolução
7. **Períodos Favoráveis e Desafiadores** - Momentos de atenção ao longo do ano
8. **Recomendações Práticas** - Sugestões para aproveitar ao máximo o ano

Seja específico e prático. Compare sempre com o mapa natal quando relevante.
Use linguagem acessível e inclua insights úteis para o dia a dia.`,
    },
    {
      role: 'user',
      content: `Analise minha Revolução Solar para ${year} comparando com meu Mapa Natal:

=== MAPA NATAL ===
${formatChartForAI(natalChart)}

=== REVOLUÇÃO SOLAR ${year} ===
${formatChartForAI(solarReturn)}

Data exata do retorno solar: ${solarReturn.birthData.date} às ${solarReturn.birthData.time} UTC

Por favor, forneça uma análise completa comparando os dois mapas e indicando as tendências para o ano ${year}.`,
    },
  ];
}

export async function GET() {
  // Retorna lista de modelos disponíveis
  return NextResponse.json({ models: AVAILABLE_MODELS });
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
  ).slice(0, 15);
  
  for (const aspect of majorAspects) {
    const applying = aspect.applying ? ' aplicando' : ' separando';
    result += `${aspect.planet1} ${aspect.type} ${aspect.planet2} (órbita: ${aspect.orb.toFixed(1)}°${applying})\n`;
  }
  
  result += `\nPor favor, gere um relatório astrológico completo e detalhado baseado nestes dados.`;
  
  return result;
}

function parseAIReport(content: string): AIReport {
  const sections: { title: string; content: string }[] = [];
  
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
  
  if (currentTitle && currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n').trim(),
    });
  }
  
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
