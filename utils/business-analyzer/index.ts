import fetch from 'node-fetch';
import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';

interface WebsiteData {
    url: string;
    content: string;
    meta: {
        title: string;
        description: string | null;
        keywords: string | null;
    };
    rawHtml: string;
}



export class BusinessInformationAnalyzer {
    private domain: string;
    private anthropic: Anthropic;
    private analysisId: string;
    private supabase: SupabaseClient;

    constructor(domain: string, analysisId: string, supabase: SupabaseClient) {
        this.domain = domain.replace(/^(https?:\/\/)/, '').trim();
        this.analysisId = analysisId;
        this.supabase = supabase;
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
    }

    private async _updateAnalysis(updates: {
        initial_findings?: any;
        information_needed?: any;
        verification_questions?: any;
        status?: 'pending' | 'processing' | 'completed' | 'failed';
        progress?: string;
        error_message?: string;
    }) {
        const { error } = await this.supabase
            .from('business_analyses')
            .update(updates)
            .eq('id', this.analysisId);

        if (error) {
            console.error('Error updating analysis:', error);
        }
    }

    async analyzeBusiness() {
        try {
            await this._updateAnalysis({ 
                status: 'processing',
                progress: 'Gathering website data...'
            });

            console.log('Gathering website data...');

            const websiteData = await this._gatherWebsiteData();
            if (!websiteData || websiteData.length === 0) {
                throw new Error('No website data available');
            }   

            console.log('Website data gathered:', websiteData);

            // Analyze each section sequentially and update the database
            await this._updateAnalysis({ progress: 'Analyzing core business...' });
            const coreBusiness = await this._analyzeCoreBusiness(websiteData[0]);
            await this._updateAnalysis({ 
                initial_findings: { coreBusiness },
                progress: 'Analyzing market position...'
            });
            console.log('Market position analysis complete');
            const marketPosition = await this._analyzeMarketPosition(websiteData[0]);
            await this._updateAnalysis({ 
                initial_findings: { coreBusiness, marketPosition },
                progress: 'Analyzing customer journey...'
            });
            console.log('Customer journey analysis complete');
            const customerJourney = await this._analyzeCustomerJourney(websiteData[0]);
            await this._updateAnalysis({ 
                initial_findings: { coreBusiness, marketPosition, customerJourney },
                progress: 'Analyzing technical specifics...'
            });
            console.log('Technical specifics analysis complete');
            const technicalSpecifics = await this._analyzeTechnicalSpecifics(websiteData[0]);
            const initialFindings = {
                coreBusiness,
                marketPosition,
                customerJourney,
                technicalSpecifics
            };
            console.log('Initial findings generated:', initialFindings);
            await this._updateAnalysis({ 
                initial_findings: initialFindings,
                progress: 'Generating additional insights...'
            });

            const informationNeeded = await this._generateInformationNeeded(initialFindings);
            const verificationQuestions = await this._createVerificationQuestions(initialFindings);
            console.log('Verification questions generated:', verificationQuestions);
            // Final update with all data
            await this._updateAnalysis({
                initial_findings: initialFindings,
                information_needed: informationNeeded,
                verification_questions: verificationQuestions,
                status: 'completed',
                progress: 'Analysis complete'
            });
            console.log('Analysis complete');
            return {
                initialFindings,
                informationNeeded,
                verificationQuestions
            };

        } catch (error: any) {
            await this._updateAnalysis({
                status: 'failed',
                error_message: error.message,
                progress: 'Analysis failed'
            });
            throw error;
        }
    }

    private async _analyzeSection(section: string, content: string) {
        const message = await this.anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1000,
            temperature: 0,
            system: "You are a JSON-only API. Return raw analysis data without any wrapping or metadata.",
            messages: [{
                role: "user",
                content: content
            }]
        });

        // Parse the response content
        const responseContent = message.content[0].type === 'text' 
            ? message.content[0].text 
            : '';
            
        // Parse the raw data
        const rawData = JSON.parse(responseContent);
        
        // Standardize the data structure
        return this._standardizeData(rawData);
    }

    private _standardizeData(data: any) {
        const standardized = { ...data };
        
        // Helper function to ensure array values
        const ensureArray = (value: any): string[] => {
            if (value === null || value === undefined) return [];
            if (Array.isArray(value)) return value.filter(item => item !== null);
            if (typeof value === 'string') return [value];
            return [];
        };

        // Helper function to standardize object values
        const standardizeObjectValues = (obj: any) => {
            const result: any = {};
            Object.entries(obj).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    result[key] = ensureArray(value);
                } else if (value === null || value === undefined) {
                    result[key] = [];
                } else if (typeof value === 'object') {
                    result[key] = standardizeObjectValues(value);
                } else if (typeof value === 'string') {
                    result[key] = value;
                } else {
                    result[key] = [];
                }
            });
            return result;
        };

        // Standardize each field in the data
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'confidenceScores') return; // Skip confidence scores

            if (Array.isArray(value)) {
                standardized[key] = ensureArray(value);
            } else if (typeof value === 'object' && value !== null) {
                standardized[key] = standardizeObjectValues(value);
            } else if (typeof value === 'string') {
                standardized[key] = value;
            } else if (value === null || value === undefined) {
                standardized[key] = [];
            }
        });

        return standardized;
    }

    private async _generateInformationNeeded(findings: any) {
        const critical: any[] = [];
        const recommended: any[] = [];

        // Helper to check confidence and empty arrays/null values
        const needsMoreInfo = (section: string, field: string, data: any, confidence: number) => {
            const isEmpty = Array.isArray(data) ? data.length === 0 : data === null;
            return {
                category: section,
                field: field,
                currentValue: data,
                question: this._generateQuestion(section, field),
                confidence
            };
        };

        // Analyze each section
        Object.entries(findings).forEach(([section, data]: [string, any]) => {
            const scores = data.confidenceScores || {};
            
            (Object.entries(scores) as [string, number][]).forEach(([field, score]) => {
                // Skip the competitors field
                if (field === 'competitors') return;
                
                const fieldData = data[field];
                
                // Add to critical if confidence is very low or data is missing
                if (score <= 0.3 || (fieldData && Object.keys(fieldData).length === 0)) {
                    critical.push(needsMoreInfo(section, field, data[field], score));
                }
                // Add to recommended if confidence is moderate
                else if (score <= 0.6) {
                    recommended.push(needsMoreInfo(section, field, data[field], score));
                }
            });
        });

        return { critical, recommended };
    }

    private _generateVerificationQuestion(category: string, field: string, value: any): string {
        // Determine if it's a software/service business
        const isSoftwareBusiness = value?.services?.some((s: string) => 
            s.toLowerCase().includes('software') || 
            s.toLowerCase().includes('saas') ||
            s.toLowerCase().includes('platform')
        );

        const questions: { [key: string]: { [key: string]: string } } = {
            coreBusiness: {
                offerings: "We identified these products and services. Have we missed any?",
                targetCustomer: "Is this an accurate description of your target customers?",
                geographicScope: value === "international"
                    ? "Do you serve customers internationally?"
                    : value === "national"
                    ? "Do you serve customers nationwide? Any plans for international expansion?"
                    : "We see you serve local customers. What geographic areas do you cover?",
                painPoints: "Are these the main problems your customers are trying to solve?",
                businessModel: value === "B2C" 
                    ? "We see you're primarily B2C. Do you also serve business customers?"
                    : "We see you're primarily B2B. Do you also serve consumer customers?",
            },
            marketPosition: {
                uniqueFactors: "Are these your key differentiators in the market?",
                pricePosition: "Would you describe your pricing as mid-range?",
                credentials: "What other credentials or experience should we add?",
                businessAge: "How long has your business been operating?"
            },
            customerJourney: {
                buyingProcess: "Is this how customers typically discover and purchase from you?",
                commonQuestions: "What other questions do customers frequently ask?",
                objections: "What other concerns do customers typically raise?",
                salesCycle: "Is this sales cycle length typical for your business?",
                conversionPoints: "Are these the main ways customers engage with your business?"
            },
            technicalSpecifics: {
                terminology: "Are these the key terms used in your industry?",
                specifications: isSoftwareBusiness
                    ? "What are the key technical requirements and integrations?"
                    : "What are the key technical specifications of your products?",
                seasonality: "How do seasons affect your business?",
                regulations: "Are there other regulations that affect your business?",
                industryTrends: "What other trends are you seeing in your industry?"
            }
        };

        return questions[category]?.[field] || `We found the following ${field}. Is this correct?`;
    }

    private async _createVerificationQuestions(findings: any) {
        const questions: any[] = [];

        Object.entries(findings).forEach(([section, data]: [string, any]) => {
            const scores = data.confidenceScores || {};
            
            (Object.entries(scores) as [string, number][]).forEach(([field, score]) => {
                if (score >= 0.7 && data[field]) {
                    // Standardize the currentValue format
                    let standardizedValue = data[field];
                    
                    // Convert to a consistent format based on the type
                    if (Array.isArray(data[field])) {
                        standardizedValue = {
                            type: 'list',
                            items: data[field]
                        };
                    } else if (typeof data[field] === 'object') {
                        standardizedValue = {
                            type: 'object',
                            items: Object.entries(data[field]).map(([key, value]) => ({
                                key,
                                value: this._ensureArray(value)
                            }))
                        };
                    } else {
                        // Convert single values to arrays
                        standardizedValue = {
                            type: 'list',
                            items: [data[field]].filter(Boolean)
                        };
                    }

                    questions.push({
                        category: section,
                        field: field,
                        currentValue: standardizedValue,
                        question: this._generateVerificationQuestion(section, field, data[field]),
                        confidence: score
                    });
                }
            });
        });

        return questions.sort((a, b) => b.confidence - a.confidence);
    }

    private _ensureArray(value: any): string[] {
        if (value === null || value === undefined) {
            return [];
        }
        if (Array.isArray(value)) {
            return value.filter(Boolean);
        }
        if (typeof value === 'string') {
            return [value];
        }
        return [];
    }

    private _generateQuestion(section: string, field: string): string {
        const questions: { [key: string]: { [key: string]: string } } = {
            marketPosition: {
                competitors: "Who are your main competitors?",
                businessAge: "How long have you been in business?",
                pricePosition: "What is your pricing strategy relative to competitors?",
                credentials: "What certifications, awards, or experience validates your expertise?"
            },
            technicalSpecifics: {
                specifications: "What are the key technical specifications of your products?",
                seasonality: "Are there any seasonal patterns in your business?",
                regulations: "What regulations or compliance requirements affect your business?",
                industryTrends: "What current and emerging trends are affecting your industry?"
            },
            coreBusiness: {
                painPoints: "What customer problems does your business solve?",
                targetCustomer: "Who is your ideal customer?",
                geographicScope: "What geographic areas do you serve?"
            },
            customerJourney: {
                objections: "What concerns do customers typically have?",
                commonQuestions: "What questions do customers frequently ask?",
                salesCycle: "How long does your typical sales process take?"
            }
        };

        return questions[section]?.[field] || `Please provide more information about ${field}`;
    }

    private async _gatherWebsiteData(): Promise<WebsiteData[]> {
        try {
            // Start with homepage
            const response = await fetch(`https://${this.domain}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch website: ${response.statusText}`);
            }
            
            const html = await response.text();
            
            // Store the raw HTML immediately
            await this.supabase
                .from('website_scrapes')
                .update({ 
                    raw_html: html,
                    status: 'completed'
                })
                .eq('domain', this.domain);
            
            // Extract content with default values
            const extracted = this._extractRelevantContent(html);
            
            return [{
                url: this.domain,
                content: extracted.content,
                meta: {
                    title: extracted.meta.title || this.domain,
                    description: extracted.meta.description,
                    keywords: extracted.meta.keywords
                },
                rawHtml: html
            }];

        } catch (error: unknown) {
            console.error('Error gathering website data:', error);
            // Update scrape status to failed if there's an error
            await this.supabase
                .from('website_scrapes')
                .update({ 
                    status: 'failed',
                    error_message: error instanceof Error ? error.message : 'Unknown error occurred'
                })
                .eq('domain', this.domain);

            return [{
                url: this.domain,
                content: '',
                meta: {
                    title: this.domain,
                    description: null,
                    keywords: null
                },
                rawHtml: ''
            }];
        }
    }

    private _extractRelevantContent(html: string) {
        try {
            // Remove script and style tags
            html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
            
            // Extract meta information with fallbacks
            const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || '';
            const metaDescription = html.match(/<meta\s+name="description"\s+content="([^"]*)">/i)?.[1] || null;
            const metaKeywords = html.match(/<meta\s+name="keywords"\s+content="([^"]*)">/i)?.[1] || null;
            // Extract main content with fallback
            const bodyContent = html.match(/<body[^>]*>(.*?)<\/body>/i)?.[1] || html;
            const content = bodyContent
                .replace(/<[^>]*>/g, ' ') // Remove HTML tags
                .replace(/\s+/g, ' ')     // Normalize whitespace
                .trim() || 'No content found';

            return {
                meta: {
                    title: title || this.domain,
                    description: metaDescription,
                    keywords: metaKeywords
                },
                content
            };
        } catch (error) {
            console.error('Error extracting content:', error);
            return {
                meta: {
                    title: this.domain,
                    description: null,
                    keywords: null
                },
                content: 'Error extracting content'
            };
        }
    }

    private async _analyzeCoreBusiness(websiteData: WebsiteData) {
        const analysisPrompt = `You are a JSON-only response API. Analyze this website and return only the following JSON structure:

        {
            "offerings": {
                "products": ["list of identified products"] or null,
                "services": ["list of identified services"] or null
            },
            "targetCustomer": {
                "demographics": ["identified demographic traits"],
                "psychographics": ["identified psychographic traits"]
            },
            "geographicScope": "local|national|international",
            "painPoints": ["identified customer pain points"],
            "businessModel": "B2B|B2C|B2B2C",
            "confidenceScores": {
                "offerings": 0-1,
                "targetCustomer": 0-1,
                "geographicScope": 0-1,
                "painPoints": 0-1,
                "businessModel": 0-1
            }
        }

        Website Content to analyze:
        Title: ${websiteData.meta.title}
        Description: ${websiteData.meta.description}
        Main Content: ${websiteData.content}`;

        return this._analyzeSection('coreBusiness', analysisPrompt);
    }

    private async _analyzeMarketPosition(websiteData: WebsiteData) {
        const analysisPrompt = `You are a JSON-only response API. Analyze this website and return only the following JSON structure:

        {
            "competitors": {
                "mentioned": ["explicitly mentioned competitors"],
                "inferred": ["inferred competitors based on content"]
            },
            "uniqueFactors": ["identified unique selling propositions"],
            "pricePosition": {
                "level": "budget|mid-range|premium",
                "indicators": ["evidence for price position"]
            },
            "credentials": {
                "awards": ["identified awards"],
                "certifications": ["identified certifications"],
                "experience": ["experience indicators"]
            },
            "businessAge": {
                "years": number or null,
                "indicators": ["evidence for business age"]
            },
            "confidenceScores": {
                "competitors": 0-1,
                "uniqueFactors": 0-1,
                "pricePosition": 0-1,
                "credentials": 0-1,
                "businessAge": 0-1
            }
        }

        Website Content to analyze:
        Title: ${websiteData.meta.title}
        Description: ${websiteData.meta.description}
        Main Content: ${websiteData.content}`;

        return this._analyzeSection('marketPosition', analysisPrompt);
    }

    private async _analyzeCustomerJourney(websiteData: WebsiteData) {
        const analysisPrompt = `You are a JSON-only response API. Analyze this website and return only the following JSON structure:

        {
            "buyingProcess": {
                "stages": ["identified stages in buying process"],
                "touchpoints": ["identified customer touchpoints"]
            },
            "commonQuestions": {
                "explicit": ["questions directly addressed on site"],
                "implicit": ["questions implied by content"]
            },
            "objections": ["identified customer objections"],
            "salesCycle": {
                "length": "immediate|days|weeks|months",
                "indicators": ["evidence for sales cycle length"]
            },
            "conversionPoints": {
                "primary": ["primary conversion actions"],
                "secondary": ["secondary conversion actions"]
            },
            "confidenceScores": {
                "buyingProcess": 0-1,
                "commonQuestions": 0-1,
                "objections": 0-1,
                "salesCycle": 0-1,
                "conversionPoints": 0-1
            }
        }

        Website Content to analyze:
        Title: ${websiteData.meta.title}
        Description: ${websiteData.meta.description}
        Main Content: ${websiteData.content}`;

        return this._analyzeSection('customerJourney', analysisPrompt);
    }

    private async _analyzeTechnicalSpecifics(websiteData: WebsiteData) {
        const analysisPrompt = `You are a JSON-only response API. Analyze this website and return only the following JSON structure:

        {
            "terminology": {
                "industry_terms": ["identified industry-specific terms"],
                "technical_terms": ["identified technical terms"]
            },
            "specifications": {
                "technical_specs": ["identified technical specifications"],
                "standards": ["identified industry standards"]
            },
            "seasonality": {
                "patterns": ["identified seasonal patterns"],
                "peak_periods": ["identified peak periods"]
            },
            "regulations": {
                "explicit": ["explicitly mentioned regulations"],
                "implicit": ["implied regulatory requirements"]
            },
            "industryTrends": {
                "current": ["identified current trends"],
                "emerging": ["identified emerging trends"]
            },
            "confidenceScores": {
                "terminology": 0-1,
                "specifications": 0-1,
                "seasonality": 0-1,
                "regulations": 0-1,
                "industryTrends": 0-1
            }
        }

        Website Content to analyze:
        Title: ${websiteData.meta.title}
        Description: ${websiteData.meta.description}
        Main Content: ${websiteData.content}`;

        return this._analyzeSection('technicalSpecifics', analysisPrompt);
    }
}

// Update the wrapper function
export async function gatherBusinessInformation(
    domain: string, 
    analysisId: string, 
    supabase: SupabaseClient
): Promise<any> {
    console.log('initializing analysis for domain:', domain);
    const analyzer = new BusinessInformationAnalyzer(domain, analysisId, supabase);
    return await analyzer.analyzeBusiness();
}
