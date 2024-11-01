import { NextResponse } from 'next/server';
import { gatherBusinessInformation } from '@/utils/business-analyzer';

export async function POST(request: Request) {
    try {
        const { domain } = await request.json();
        
        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        const analysis = await gatherBusinessInformation(domain);

        return NextResponse.json({
            success: true,
            data: analysis
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error: any) {
        console.error('Error analyzing website:', error);
        
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to analyze website'
        }, { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}