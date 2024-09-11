import React, { useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ArrowUpIcon, ArrowDownIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface Audit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  numericValue?: number;
  // Add other properties as needed
}

interface AuditRef {
  id: string;
  weight: number;
  group?: string;
}

interface LighthouseAuditsProps {
  lighthouseData: {
    audits: {
      [key: string]: Audit;
    };
    categories: {
      [key: string]: {
        auditRefs: AuditRef[];
      };
    };
  };
  category: string;
}

const LighthouseAudits: React.FC<LighthouseAuditsProps> = ({ lighthouseData, category }) => {
  const categoryData = lighthouseData.categories[category];
  const [showPassedAudits, setShowPassedAudits] = useState(false);

  if (!categoryData) {
    return <div>No data available for this category.</div>;
  }

  const allRelevantAudits = categoryData.auditRefs
    .map(ref => ({
      ...lighthouseData.audits[ref.id],
      weight: ref.weight,
      group: ref.group
    }))
    .filter(audit => audit.score !== null && audit.score !== undefined);

  const passedAudits = allRelevantAudits.filter(audit => audit.score === 1);
  const otherAudits = allRelevantAudits.filter(audit => audit.score !== 1);

  const sortedOtherAudits = otherAudits.sort((a, b) => {
    if (b.weight !== a.weight) {
      return b.weight - a.weight; // Primary sort by weight
    }
    return (a.score || 0) - (b.score || 0); // Secondary sort by score (lower score first)
  });

  const renderAuditItem = (audit: Audit & { weight: number, group?: string }) => (
    <Disclosure key={audit.id} as="div">
      <dt>
        <DisclosureButton className="group flex w-full items-start justify-between text-left text-gray-900 pt-3 pb-2">
          <span>
            <span className="font-bold text-orange-600 hover:text-orange-500">{audit.title}{audit.displayValue ? `: ` : ''} </span>
            {audit.displayValue}
          </span> 
          <span className="ml-6 mr-4 ring-1 rounded-full flex h-7 w-7 align-middle justify-center ring-gray-700 items-center">
            <ArrowDownIcon aria-hidden="true" className="h-4 w-4 group-data-[open]:hidden" />
            <ArrowUpIcon aria-hidden="true" className="h-4 w-4 [.group:not([data-open])_&]:hidden" />
          </span>
        </DisclosureButton>
      </dt>
      <DisclosurePanel as="dd" className="mt-2 pr-12 pb-6">
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ReactMarkdown className="parsedown text-base leading-7 text-gray-600">
            {audit.description}
          </ReactMarkdown>
        </motion.div>
      </DisclosurePanel>
    </Disclosure>
  );

  return (
    <div className="lighthouse-audits">
      <dl className='divide-y divide-gray-200'>
        {sortedOtherAudits.map(renderAuditItem)}
      </dl>
      
      <div className="border-b border-gray-200 pb-5 mt-8">
        <h3 className="text-xl inline-block font-bold leading-6 text-gray-900">
          <CheckBadgeIcon className="w-10 h-10 text-green-500 inline-block mr-2" />
          Passed Audits - {passedAudits.length}
        </h3>
        <button 
          onClick={() => setShowPassedAudits(!showPassedAudits)} 
          className='text-gray-500 text-sm float-right cursor-pointer py-4 hover:text-gray-900'
        >
          {showPassedAudits ? 'Hide passed audits' : 'Show passed audits'}
        </button>
      </div>
      {showPassedAudits && (
        <motion.dl
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className='divide-y divide-gray-200'
        >
          {passedAudits.map(renderAuditItem)}
        </motion.dl>
      )}
    </div>
  );
};

export default LighthouseAudits;
