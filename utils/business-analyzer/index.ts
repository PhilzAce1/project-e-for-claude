import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import Anthropic from '@anthropic-ai/sdk';

interface WebsiteData {
    dom: Document;
    html: string;
    text: string;
    structuredData: any[];
    links: Array<{
        text: string;
        href: string;
    }>;
    forms: Array<{
        id: string;
        action: string;
        fields: string[];
    }>;
    meta: {
        title: string;
        description: string | undefined;
        keywords: string | undefined;
    };
}

interface InformationNeeded {
    critical: Array<{
        category: string;
        field: string;
        currentValue: any;
        question: string;
    }>;
    recommended: Array<{
        category: string;
        field: string;
        currentValue: any;
        question: string;
    }>;
}

export class BusinessInformationAnalyzer {
    private domain: string;
    private anthropic: Anthropic;

    constructor(domain: string) {
        this.domain = domain;
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
    }

    async analyzeBusiness() {
        try {
            const websiteData = await this._gatherWebsiteData();
            
            // Get initial findings
            const initialFindings = {
                coreBusiness: await this._analyzeCoreBusiness(websiteData),
                marketPosition: await this._analyzeMarketPosition(websiteData),
                customerJourney: await this._analyzeCustomerJourney(websiteData),
                technicalSpecifics: await this._analyzeTechnicalSpecifics(websiteData)
            };

            // Generate information needed and verification questions based on findings
            const informationNeeded = await this._generateInformationNeeded(initialFindings);
            const verificationQuestions = await this._createVerificationQuestions(initialFindings);

            return {
                initialFindings,
                informationNeeded,
                verificationQuestions
            };
        } catch (error) {
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

        // Parse and return raw data
        const rawData = JSON.parse(message.content[0].text);
        return rawData;
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
            
            Object.entries(scores).forEach(([field, score]: [string, number]) => {
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

    private async _createVerificationQuestions(findings: any) {
        const questions: any[] = [];

        // Add verification questions for high-confidence findings
        Object.entries(findings).forEach(([section, data]: [string, any]) => {
            const scores = data.confidenceScores || {};
            
            Object.entries(scores).forEach(([field, score]: [string, number]) => {
                if (score >= 0.7 && data[field]) {
                    questions.push({
                        category: section,
                        field: field,
                        currentValue: data[field],
                        question: `We found the following ${field}. Is this correct?`,
                        confidence: score
                    });
                }
            });
        });

        // Sort by confidence score descending
        return questions.sort((a, b) => b.confidence - a.confidence);
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

    private async _gatherWebsiteData(): Promise<WebsiteData> {
        const response = await fetch(`https://${this.domain}`);
        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Extract structured data
        const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
            .map(script => {
                try {
                    return JSON.parse(script.textContent || '');
                } catch (e) {
                    return null;
                }
            })
            .filter(data => data !== null);

        // Extract links
        const links = Array.from(document.querySelectorAll('a'))
            .map(a => ({
                text: a.textContent?.trim() || '',
                href: a.getAttribute('href') || ''
            }))
            .filter(link => link.text && link.href);

        // Extract forms
        const forms = Array.from(document.querySelectorAll('form'))
            .map(form => ({
                id: form.id,
                action: form.action,
                fields: Array.from(form.elements).map((e: any) => e.name).filter(Boolean)
            }));

        return {
            dom: document,
            html,
            text: document.body?.textContent || '',
            structuredData,
            links,
            forms,
            meta: {
                title: document.title,
                description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
                keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')
            }
        };
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
        Main Content: ${websiteData.text}
        Links: ${JSON.stringify(websiteData.links.slice(0, 10))}`;

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
        Main Content: ${websiteData.text}
        Structured Data: ${JSON.stringify(websiteData.structuredData)}`;

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
        Main Content: ${websiteData.text}
        Forms: ${JSON.stringify(websiteData.forms)}
        Links: ${JSON.stringify(websiteData.links)}`;

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
        Main Content: ${websiteData.text}
        Structured Data: ${JSON.stringify(websiteData.structuredData)}`;

        return this._analyzeSection('technicalSpecifics', analysisPrompt);
    }
}

// Single wrapper at the top level only
export async function gatherBusinessInformation(domain: string): Promise<any> {
    try {
        const analyzer = new BusinessInformationAnalyzer(domain);
        const rawData = await analyzer.analyzeBusiness();
        
        // Add single success wrapper
        return rawData;
    } catch (error) {
       throw error;
}
