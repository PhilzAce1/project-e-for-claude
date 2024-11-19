

interface FieldContext {
  title: string;
  description: string;
  subsections?: Record<string, {
    title?: string;
    description: string;
    examples: string[];
  }>;
}

// Single source of truth for all field contexts
const fieldContexts: Record<string, FieldContext> = {
  // Core Business Fields
  offerings: {
    title: "Products & Services",
    description: "Your business's core products and services help us understand what you offer to the market.",
    subsections: {
      products: {
        description: "Physical or digital items that customers can purchase",
        examples: ["Software platforms", "Physical products", "Digital downloads"]
      },
      services: {
        description: "Services and solutions you provide to customers",
        examples: ["Consulting services", "Managed services", "Professional services"]
      }
    }
  },
  targetCustomer: {
    title: "Target Customer Profile",
    description: "Understanding your ideal customer profile helps focus marketing and product development efforts.",
    subsections: {
      demographics: {
        description: "Observable characteristics of your target customers",
        examples: ["Industry sectors", "Company size", "Geographic location"]
      },
      psychographics: {
        description: "Behavioral and mindset characteristics of your customers",
        examples: ["Values", "Priorities", "Decision-making style"]
      }
    }
  },
  painPoints: {
    title: "Customer Pain Points",
    description: "Understanding customer problems helps align your solutions.",
    // No subsections as this is a simple list
  },
  businessModel: {
    title: "Business Model",
    description: "Your business model defines how you create and deliver value.",
    // No subsections as this is a simple choice
  },
  geographicScope: {
    title: "Geographic Reach",
    description: "Your geographic reach impacts marketing and operations strategies.",
    // No subsections as this is a simple choice
  },

  // Market Position Fields
  competitors: {
    title: "Competition",
    description: "Understanding your competitive landscape helps position your business effectively.",
    subsections: {
      mentioned: {
        description: "Competitors explicitly mentioned or referenced",
        examples: ["Direct competitors", "Named companies in your space"]
      },
      inferred: {
        description: "Companies that appear to compete in your market",
        examples: ["Similar service providers", "Alternative solutions"]
      }
    }
  },
  uniqueFactors: {
    title: "Unique Value Proposition",
    description: "Your differentiators set you apart in the market.",
    // No subsections as this is a simple list
  },
  pricePosition: {
    title: "Pricing Strategy",
    description: "Your pricing strategy impacts market positioning and customer perception.",
    subsections: {
      level: {
        description: "Your general price positioning in the market",
        examples: ["Premium", "Mid-market", "Value-focused"]
      },
      indicators: {
        description: "Factors that justify or explain your pricing",
        examples: ["Quality level", "Service inclusions", "Market positioning"]
      }
    }
  },
  credentials: {
    title: "Credentials & Experience",
    description: "Your credentials and experience demonstrate expertise and build trust.",
    subsections: {
      awards: {
        description: "Recognition received from industry or business organizations",
        examples: ["Industry awards", "Business achievements", "Public recognition"]
      },
      certifications: {
        description: "Official certifications and accreditations",
        examples: ["Professional certifications", "Industry certifications", "Quality standards"]
      },
      experience: {
        description: "Notable achievements and experience in your field",
        examples: ["Years in business", "Major projects", "Key accomplishments"]
      }
    }
  },
  businessAge: {
    title: "Business History",
    description: "Your business history demonstrates experience and stability.",
    subsections: {
      years: {
        description: "Time period of business operation",
        examples: ["Years in business", "Founding date", "Major milestones"]
      },
      indicators: {
        description: "Evidence of business history and experience",
        examples: ["Track record", "Historical achievements", "Evolution of business"]
      }
    }
  },

  // Customer Journey Fields
  buyingProcess: {
    title: "Customer Buying Process",
    description: "Understanding how customers make purchasing decisions helps optimize the sales process.",
    subsections: {
      stages: {
        description: "Key steps customers take before making a decision",
        examples: ["Initial contact", "Evaluation", "Negotiation", "Decision"]
      },
      touchpoints: {
        description: "Ways customers interact with your business",
        examples: ["Website visits", "Sales calls", "Demos", "Meetings"]
      }
    }
  },
  commonQuestions: {
    title: "Frequently Asked Questions",
    description: "Understanding common customer questions helps improve communication.",
    subsections: {
      explicit: {
        description: "Questions directly addressed on your website or materials",
        examples: ["FAQs", "Directly stated concerns", "Common inquiries"]
      },
      implicit: {
        description: "Questions implied by your content or industry context",
        examples: ["Underlying concerns", "Industry-specific questions", "Process inquiries"]
      }
    }
  },
  objections: {
    title: "Common Customer Concerns",
    description: "Understanding customer concerns helps improve your offering and communication.",
  },
  salesCycle: {
    title: "Sales Cycle",
    description: "Your sales cycle helps understand how customers move through the buying process.",
    subsections: {
      length: {
        description: "Typical duration from first contact to closing",
        examples: ["Immediate", "Days", "Weeks", "Months"]
      },
      indicators: {
        description: "Factors that influence your sales cycle length",
        examples: ["Decision-maker involvement", "Contract complexity", "Implementation requirements"]
      }
    }
  },
  conversionPoints: {
    title: "Customer Actions",
    description: "Understanding how customers take action helps optimize your conversion funnel.",
    subsections: {
      primary: {
        description: "Main actions that lead to business outcomes",
        examples: ["Direct purchases", "Contact requests", "Sign-ups"]
      },
      secondary: {
        description: "Supporting actions that contribute to conversions",
        examples: ["Newsletter subscriptions", "Resource downloads", "Social follows"]
      }
    }
  },

  // Technical Specifics Fields
  terminology: {
    title: "Industry Terminology",
    description: "Industry-specific language helps ensure clear communication.",
    subsections: {
      industry_terms: {
        description: "Common terms used in your industry",
        examples: ["Industry jargon", "Common abbreviations", "Sector-specific terms"]
      },
      technical_terms: {
        description: "Technical or specialized terminology",
        examples: ["Technical specifications", "Process terminology", "System-specific terms"]
      }
    }
  },
  specifications: {
    title: "Technical Details",
    description: "Technical details help customers understand your offerings.",
    subsections: {
      technical_specs: {
        description: "Specific technical characteristics of your products/services",
        examples: ["Platform capabilities", "Integration options", "Technical requirements"]
      },
      standards: {
        description: "Industry standards and specifications you follow",
        examples: ["Industry protocols", "Quality standards", "Technical frameworks"]
      }
    }
  },
  seasonality: {
    title: "Seasonal Patterns",
    description: "Understanding seasonal patterns helps optimize business operations.",
    subsections: {
      patterns: {
        description: "Regular fluctuations in business activity",
        examples: ["Busy seasons", "Quiet periods", "Cyclical patterns"]
      },
      peak_periods: {
        description: "Specific times of high business activity",
        examples: ["Annual events", "Industry cycles", "Seasonal peaks"]
      }
    }
  },
  regulations: {
    title: "Regulatory Requirements",
    description: "Regulatory compliance is crucial for business operations.",
    subsections: {
      explicit: {
        description: "Clearly stated regulatory requirements",
        examples: ["Industry regulations", "Legal requirements", "Compliance standards"]
      },
      implicit: {
        description: "Implied or indirect regulatory considerations",
        examples: ["Best practices", "Industry guidelines", "Voluntary standards"]
      }
    }
  },
  industryTrends: {
    title: "Industry Trends",
    description: "Staying aware of industry trends helps maintain competitive advantage.",
    subsections: {
      current: {
        description: "Present trends affecting your industry",
        examples: ["Market shifts", "Technology adoption", "Customer preferences"]
      },
      emerging: {
        description: "Future trends that may impact your business",
        examples: ["New technologies", "Changing regulations", "Market evolution"]
      }
    }
  }
};

export { fieldContexts };