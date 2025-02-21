'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';

export default function PostHogProvider() {
  useEffect(() => {
    posthog.init('phc_eo79hckGlZY0wY0WL7cpVHxPkpWdEhwUvKJzKcwowen', {
      api_host: 'https://eu.i.posthog.com',
      person_profiles: 'identified_only'
    });
  }, []);

  return null;
} 