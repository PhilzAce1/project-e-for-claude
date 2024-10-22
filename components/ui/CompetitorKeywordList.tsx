'use client'

import { useState, useEffect } from 'react'
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import KeywordTable from './KeywordTable'

const CompetitorKeywordList = ({competitors}) => {
    const [selected, setSelected] = useState(null)
    const [isLoading, setIsLoading] = useState(true);
    const [keywords, setKeywords] = useState([]);

    useEffect(() => {
        if (competitors && competitors.length > 0) {
            setSelected(competitors[0])
            setIsLoading(false)
        }
    }, [competitors]);

    useEffect(() => {
        if (selected) {
            setIsLoading(true);
            console.log('selected', selected)
            fetchKeywords(selected);
        }
    }, [selected]);

    const fetchKeywords = async (competitor) => {
        try {
            // This is a placeholder. Replace with your actual API call if needed.
            setKeywords(competitor.rankings_data?.items || []);
        } catch (error) {
            console.error('Error fetching keywords:', error);
            setKeywords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompetitorChange = (newSelected) => {
        console.log('am i changing?', newSelected)
        setSelected(newSelected);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className='flex items-center gap-4 mb-4'>
                <Listbox value={selected} onChange={handleCompetitorChange}>
                    <Label className="block text-sm font-medium leading-6 text-gray-900">Show Competitor</Label>
                    <div className="relative mt-2">
                        <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                            <span className="block truncate">{selected?.domain}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon aria-hidden="true" className="h-5 w-5 text-gray-400" />
                            </span>
                        </ListboxButton>

                        <ListboxOptions
                            transition
                            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
                        >
                            {competitors.map((competitor) => (
                                <ListboxOption
                                    key={competitor.id}
                                    value={competitor}
                                    className="group relative cursor-default select-none py-2 pl-8 pr-4 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
                                >
                                    <span className="block truncate font-normal group-data-[selected]:font-semibold">{competitor.domain}</span>

                                    <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-indigo-600 group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                                        <CheckIcon aria-hidden="true" className="h-5 w-5" />
                                    </span>
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </div>
                </Listbox>
            </div>
            <KeywordTable keywords={keywords} />
        </div>
    )
}

export default CompetitorKeywordList
