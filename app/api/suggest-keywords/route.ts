import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Anthropic } from '@anthropic-ai/sdk';

export const maxDuration = 300;

export async function POST(req: Request) {
    let keywordSections;
    try {
      const { userId } = await req.json();
  
      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required' },
          { status: 400 }
        );
      }
  
      const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
      });

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      });

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

      // Then fetch business analysis answers
      const { data: businessData, error: answersError } = await supabase
        .from('business_analysis_answers')
        .select('category, field_name, answer')
        .eq('analysis_id', businessAnalysis.id); 
      
      if (answersError) {
        throw new Error('Failed to fetch business analysis answers');
      }

      console.log('businessData', businessData)
      // Create prompt for LLM
      const prompt = `
        This is the business information
        ${JSON.stringify(businessData)}
      `;

      console.log('first call')
      // Generate keywords using LLM
      const initialResponse = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2000,
        temperature: 0.5,
        system: "You are an SEO expert who is unreal at suggesting keywords for businesses based on their business information, we want to make sure we get the best seed keywords possible and segment by search intent (commercial, informational, navigational, transactional). Based on the following business information, please suggest at least 100 keywords and return in an array: Ensure the response is in an array, where the internal object of each array item is\n{ \n\"sectionTitle\": string,\n\"keywords\": string[]\n}. Only return the array, nothing else.",
        messages: [{ role: "user", content: prompt }]
      }); 

      try {
        // @ts-ignore
        keywordSections = JSON.parse(initialResponse.content[0].text);
        console.log('keywordSections parsed successfully:', keywordSections);
      } catch (parseError) {
        console.log('Error parsing initial response, continuing conversation');
        
        // Continue the conversation with the incomplete response
        const continuationResponse = await anthropic.messages.create({
          model: "claude-3-sonnet-20240229",
          max_tokens: 2000,
          temperature: 0.5,
          system: "You are an SEO expert who is unreal at suggesting keywords for businesses based on their business information, we want to make sure we get the best seed keywords possible and segment by search intent (commercial, informational, navigational, transactional). Based on the following business information, please suggest at least 100 keywords and return in an array: Ensure the response is in an array, where the internal object of each array item is\n{ \n\"sectionTitle\": string,\n\"keywords\": string[]\n}. Only return the array, nothing else.",
          messages: [
            { role: "user", content: prompt },
            // @ts-ignore
            { role: "assistant", content: initialResponse.content[0].text },
            { role: "user", content: "I can see the array is incomplete, only sent the extra that needs to be sent to complete your working so that I can combine both outputs and have a valid JSON object. Ensure if you were mid string, that you complete that string, do not open a new array or string or object. You can add more fields if you wish if that was what your original intention was" }
          ]
        });

        // @ts-ignore
        const initialText = initialResponse.content[0].text;
        // @ts-ignore
        const continuationText = continuationResponse.content[0].text;
        
        console.log('Attempting to merge responses');
        console.log('Initial text:', initialText);
        console.log('Continuation text:', continuationText);

        // Merge the responses
        let mergedText = initialText;
        if (initialText.endsWith(',') || continuationText.startsWith(',')) {
          mergedText = mergedText.replace(/,\s*$/, '');
          mergedText += continuationText.replace(/^,\s*/, '');
        } else {
          mergedText += continuationText;
        }

        console.log('Merged text:', mergedText);
        keywordSections = JSON.parse(mergedText);
        console.log('Merged response parsed successfully');
      }

      // Save suggestions to database
      const keywordEntries = keywordSections.flatMap((section: { keywords: any[]; sectionTitle: any; }) => 
        section.keywords.map(keyword => ({
          user_id: userId,
          keyword: keyword,
          section_title: section.sectionTitle,
          source: 'LLM',
        }))
      );

      const { error: insertError } = await supabase
        .from('seed_keyword_suggestions')
        .insert(keywordEntries);


        
      Promise.resolve(
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/enrich-keywords`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId
            })
        })
      ).catch(error => {
          console.error('Error initiating analysis:', error);
      });
      
      if (insertError) {
        throw new Error(`Failed to insert seed keywords: ${insertError.message}`);
      }

      return NextResponse.json(
        { message: 'Keyword suggestions generated successfully'},
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
