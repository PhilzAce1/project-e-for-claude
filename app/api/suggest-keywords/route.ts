import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

async function generateKeywordSuggestions(id: string, userId: string) {

// Then fetch business analysis answers using the analysis_id
const { data: businessData, error: answersError } = await supabase
  .from('business_analysis_answers')
  .select('category, field_name, answer')
  .eq('analysis_id', id); 
  
  if (answersError) {
    throw new Error('Failed to fetch business analysis answers');
  }


  // Create prompt for LLM
  const prompt = `
    This is the business information
    ${businessData}
  `;
  // Generate keywords using LLM
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    temperature: 0.5,
    system: "You are an SEO expert who is unreal at suggesting keywords for businesses based on their business information. Based on the following business information, please suggest at least 100 keywords and return in an array: Ensure the response is in an array, where the internal object of each array item is\n{ \n\"sectionTitle\": string,\n\"keywords\": string[]\n}. Only return the array, nothing else.",
    messages: [{ role: "user", content: prompt }]
  }); 
  
    // @ts-ignore
  const keywordSections = JSON.parse(response.content[0].text);
  console.log('keywordSections', keywordSections);

  // Save suggestions to database
  const keywordEntries = keywordSections.flatMap((section: { keywords: any[]; sectionTitle: any; }) => 
    section.keywords.map(keyword => ({
      user_id: userId,
      keyword: keyword,
      section_title: section.sectionTitle,
      source: 'LLM',
    }))
  );

  const { error: insertError, data: insertedData } = await supabase
    .from('keyword_suggestions')
    .insert(keywordEntries);

    console.log('error?', insertError, insertedData);

  return keywordEntries;
}

export async function POST(req: Request) {
    try {
      const { userId } = await req.json();
  
      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required' },
          { status: 400 }
        );
      }
  
      // Check if user has required data
      const { data: businessAnalysis, error: analysisError } = await supabase
        .from('business_analyses')
        .select('id')
        .eq('user_id', userId)
        .single();
  
      if (analysisError || !businessAnalysis) {
        return NextResponse.json(
          { error: 'Business analysis not found' },
          { status: 404 }
        );
      }
  
      generateKeywordSuggestions(businessAnalysis.id, userId);
  
      return NextResponse.json(
        { message: 'Keyword suggestions generating'},
        { status: 200 }
      );
    } catch (error) {
      console.error('Error generating keyword suggestions:', error);
      return NextResponse.json(
        { error: 'Failed to generate keyword suggestions' },
        { status: 500 }
      );
    }
  }
