export const siteAuditDictionary = {
    "canonical": " are considered canonical (main versions of pages)",
    "duplicate_meta_tags": " have duplicate meta tags",
    "no_description": " are missing meta descriptions",
    "frame": " contain frames, which can hinder SEO",
    "large_page_size": " are larger than 1MB, which may slow loading times",
    "irrelevant_description": " have meta descriptions that don't match the content",
    "irrelevant_meta_keywords": " have meta keywords that don't match the content",
    "is_https": " are using secure HTTPS protocol",
    "is_http": " are using unsecure HTTP protocol",
    "title_too_long": " have titles longer than 65 characters",
    "low_content_rate": " have an imbalanced ratio of content to HTML",
    "small_page_size": " are smaller than 1KB, which might indicate thin content",
    "no_h1_tag": " are missing H1 headings",
    "recursive_canonical": " have circular canonical tag references",
    "no_favicon": " are missing a favicon",
    "no_image_alt": " have images without alt text",
    "no_image_title": " have images without title attributes",
    "seo_friendly_url": " have URLs that aren't SEO-friendly",
    "seo_friendly_url_characters_check": " have URLs with non-standard characters",
    "seo_friendly_url_dynamic_check": " have dynamic URLs, which can be less SEO-friendly",
    "seo_friendly_url_keywords_check": " have URLs that don't match their title tags",
    "seo_friendly_url_relative_length_check": " have URLs longer than 120 characters",
    "title_too_short": " have titles shorter than 30 characters",
    "no_content_encoding": " aren't using content compression",
    "high_waiting_time": " have a high 'Time to First Byte' (over 1.5 seconds)",
    "high_loading_time": " take longer than 3 seconds to load",
    "is_redirect": " are redirects",
    "is_broken": " are broken (returning error codes)",
    "is_4xx_code": " are returning 4XX error codes",
    "is_5xx_code": " are returning 5XX error codes",
    "is_www": " are on a www subdomain",
    "no_doctype": " are missing a DOCTYPE declaration",
    "no_encoding_meta_tag": " are missing character encoding information",
    "high_content_rate": " have an unusually high ratio of content to HTML",
    "low_character_count": " have less than 1024 characters, which might indicate thin content",
    "high_character_count": " have more than 256,000 characters, which might be too long",
    "low_readability_rate": " have low readability scores",
    "irrelevant_title": " have titles that don't match their content",
    "deprecated_html_tags": " use outdated HTML tags",
    "duplicate_title_tag": " have more than one title tag",
    "no_title": " are missing title tags",
    "flash": " contain Flash elements, which are not SEO-friendly",
    "lorem_ipsum": " contain placeholder 'Lorem Ipsum' text",
    "has_misspelling": " contain spelling errors",
    "canonical_to_broken": " have canonical links pointing to broken pages",
    "canonical_to_redirect": " have canonical links pointing to redirects",
    "has_links_to_redirects": " link to URLs that redirect elsewhere",
    "is_orphan_page": " have no internal links pointing to them",
    "has_meta_refresh_redirect": " use meta refresh redirects",
    "meta_charset_consistency": " have inconsistent character encoding declarations",
    "size_greater_than_3mb": " are larger than 3MB, which may significantly slow loading times",
    "has_html_doctype": " have HTML DOCTYPE declarations",
    "https_to_http_links": "{X} secure (HTTPS) pages link to unsecure (HTTP) pages",
    "has_render_blocking_resources": " have resources that block rendering",
    "redirect_chain": " have multiple redirects before reaching the final destination",
    "canonical_chain": " have a chain of canonical links",
    "is_link_relation_conflict": " have conflicting link rel attributes"
  }

  export const siteAutitPriority = [
    {
      "key": "is_broken",
      "impact": "high",
      "ease": "medium"
    },
    {
      "key": "no_title",
      "impact": "high",
      "ease": "easy"
    },
    {
      "key": "no_description",
      "impact": "high",
      "ease": "easy"
    },
    {
      "key": "no_h1_tag",
      "impact": "high",
      "ease": "easy"
    },
    {
      "key": "is_http",
      "impact": "high",
      "ease": "medium"
    },
    {
      "key": "high_loading_time",
      "impact": "high",
      "ease": "medium"
    },
    {
      "key": "seo_friendly_url",
      "impact": "high",
      "ease": "medium"
    },
    {
      "key": "no_image_alt",
      "impact": "medium",
      "ease": "easy"
    },
    {
      "key": "duplicate_title_tag",
      "impact": "medium",
      "ease": "easy"
    },
    {
      "key": "title_too_long",
      "impact": "medium",
      "ease": "easy"
    },
    {
      "key": "title_too_short",
      "impact": "medium",
      "ease": "easy"
    },
    {
      "key": "irrelevant_title",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "irrelevant_description",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "is_4xx_code",
      "impact": "high",
      "ease": "medium"
    },
    {
      "key": "is_5xx_code",
      "impact": "high",
      "ease": "hard"
    },
    {
      "key": "has_render_blocking_resources",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "high_waiting_time",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "large_page_size",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "is_orphan_page",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "low_content_rate",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "https_to_http_links",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "has_links_to_redirects",
      "impact": "low",
      "ease": "medium"
    },
    {
      "key": "redirect_chain",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "recursive_canonical",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "canonical_to_broken",
      "impact": "medium",
      "ease": "easy"
    },
    {
      "key": "canonical_to_redirect",
      "impact": "low",
      "ease": "easy"
    },
    {
      "key": "canonical_chain",
      "impact": "low",
      "ease": "medium"
    },
    {
      "key": "duplicate_meta_tags",
      "impact": "low",
      "ease": "easy"
    },
    {
      "key": "no_favicon",
      "impact": "low",
      "ease": "easy"
    },
    {
      "key": "no_image_title",
      "impact": "low",
      "ease": "easy"
    },
    {
      "key": "seo_friendly_url_characters_check",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "seo_friendly_url_dynamic_check",
      "impact": "medium",
      "ease": "hard"
    },
    {
      "key": "seo_friendly_url_keywords_check",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "seo_friendly_url_relative_length_check",
      "impact": "low",
      "ease": "medium"
    },
    {
      "key": "no_content_encoding",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "is_redirect",
      "impact": "low",
      "ease": "medium"
    },
    {
      "key": "no_doctype",
      "impact": "low",
      "ease": "easy"
    },
    {
      "key": "no_encoding_meta_tag",
      "impact": "low",
      "ease": "easy"
    },
    {
      "key": "high_content_rate",
      "impact": "low",
      "ease": "medium"
    },
    {
      "key": "low_character_count",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "high_character_count",
      "impact": "low",
      "ease": "medium"
    },
    {
      "key": "low_readability_rate",
      "impact": "medium",
      "ease": "hard"
    },
    {
      "key": "deprecated_html_tags",
      "impact": "low",
      "ease": "medium"
    },
    {
      "key": "flash",
      "impact": "high",
      "ease": "hard"
    },
    {
      "key": "lorem_ipsum",
      "impact": "high",
      "ease": "medium"
    },
    {
      "key": "has_misspelling",
      "impact": "medium",
      "ease": "medium"
    },
    {
      "key": "has_meta_refresh_redirect",
      "impact": "low",
      "ease": "easy"
    },
    {
      "key": "meta_charset_consistency",
      "impact": "low",
      "ease": "easy"
    },
    {
      "key": "size_greater_than_3mb",
      "impact": "high",
      "ease": "hard"
    },
    {
      "key": "is_link_relation_conflict",
      "impact": "low",
      "ease": "medium"
    },
    {
      "key": "frame",
      "impact": "medium",
      "ease": "hard"
    },
    {
      "key": "irrelevant_meta_keywords",
      "impact": "low",
      "ease": "easy"
    },
    {
      "key": "is_https",
      "impact": "high",
      "ease": "medium"
    },
    {
      "key": "small_page_size",
      "impact": "low",
      "ease": "medium"
    },
    {
      "key": "is_www",
      "impact": "low",
      "ease": "hard"
    },
    {
      "key": "has_html_doctype",
      "impact": "low",
      "ease": "easy"
    }
  ]

  export const siteAuditUserFriendlyTitles: { [key: string]: string } = {
    "canonical": "Canonical Pages",
    "duplicate_meta_tags": "Duplicate Meta Tags",
    "no_description": "Missing Meta Descriptions",
    "frame": "Pages with Frames",
    "large_page_size": "Large Page Size",
    "irrelevant_description": "Irrelevant Meta Descriptions",
    "irrelevant_meta_keywords": "Irrelevant Meta Keywords",
    "is_https": "HTTPS Protocol",
    "is_http": "HTTP Protocol",
    "title_too_long": "Long Titles",
    "low_content_rate": "Low Content Rate",
    "small_page_size": "Small Page Size",
    "no_h1_tag": "Missing H1 Tags",
    "recursive_canonical": "Recursive Canonical Tags",
    "no_favicon": "Missing Favicon",
    "no_image_alt": "Images Without Alt Text",
    "no_image_title": "Images Without Title Attributes",
    "seo_friendly_url": "Non-SEO-Friendly URLs",
    "seo_friendly_url_characters_check": "URLs with Non-Standard Characters",
    "seo_friendly_url_dynamic_check": "Dynamic URLs",
    "seo_friendly_url_keywords_check": "URLs Not Matching Title Tags",
    "seo_friendly_url_relative_length_check": "Long URLs",
    "title_too_short": "Short Titles",
    "no_content_encoding": "No Content Compression",
    "high_waiting_time": "High Time to First Byte",
    "high_loading_time": "Slow Loading Pages",
    "is_redirect": "Redirects",
    "is_broken": "Broken Pages",
    "is_4xx_code": "4XX Error Pages",
    "is_5xx_code": "5XX Error Pages",
    "is_www": "WWW Subdomain Pages",
    "no_doctype": "Missing DOCTYPE",
    "no_encoding_meta_tag": "Missing Character Encoding",
    "high_content_rate": "High Content Rate",
    "low_character_count": "Low Character Count",
    "high_character_count": "High Character Count",
    "low_readability_rate": "Low Readability",
    "irrelevant_title": "Irrelevant Titles",
    "deprecated_html_tags": "Deprecated HTML Tags",
    "duplicate_title_tag": "Duplicate Title Tags",
    "no_title": "Missing Title Tags",
    "flash": "Flash Content",
    "lorem_ipsum": "Lorem Ipsum Content",
    "has_misspelling": "Spelling Errors",
    "canonical_to_broken": "Canonical Links to Broken Pages",
    "canonical_to_redirect": "Canonical Links to Redirects",
    "has_links_to_redirects": "Links to Redirects",
    "is_orphan_page": "Orphan Pages",
    "has_meta_refresh_redirect": "Meta Refresh Redirects",
    "meta_charset_consistency": "Inconsistent Character Encoding",
    "size_greater_than_3mb": "Pages Larger Than 3MB",
    "has_html_doctype": "HTML DOCTYPE Declarations",
    "https_to_http_links": "HTTPS to HTTP Links",
    "has_render_blocking_resources": "Render-Blocking Resources",
    "redirect_chain": "Redirect Chains",
    "canonical_chain": "Canonical Chains",
    "is_link_relation_conflict": "Link Relation Conflicts"
  };

  export const siteAuditIssueFixes: { [key: string]: {
    how_to_fix: string;
    learn_more: string;
} } = {
        "canonical": {
          "how_to_fix": "Ensure each page has a single, clear canonical URL. Use the rel='canonical' tag in the <head> section of your HTML.",
          "learn_more": "https://moz.com/learn/seo/canonical-url"
        },
        "duplicate_meta_tags": {
          "how_to_fix": "Remove duplicate meta tags from your HTML. Each page should have only one meta description and one set of meta keywords.",
          "learn_more": "https://www.searchenginejournal.com/on-page-seo/meta-tags/"
        },
        "no_description": {
          "how_to_fix": "Add unique, descriptive meta descriptions to each page. Keep them under 160 characters and make them relevant to the page content.",
          "learn_more": "https://yoast.com/meta-descriptions/"
        },
        "frame": {
          "how_to_fix": "Avoid using frames or iframes for important content. If necessary, use the 'title' and 'alt' attributes to provide context for search engines.",
          "learn_more": "https://www.searchenginejournal.com/google-frames-display-correctly-mobile-search-results/259627/"
        },
        "large_page_size": {
          "how_to_fix": "Optimize images, minify CSS and JavaScript, and leverage browser caching to reduce page size and improve load times.",
          "learn_more": "https://web.dev/fast/"
        },
        "irrelevant_description": {
          "how_to_fix": "Rewrite meta descriptions to accurately summarize the page content. Each description should be unique and relevant to its specific page.",
          "learn_more": "https://ahrefs.com/blog/meta-description/"
        },
        "irrelevant_meta_keywords": {
          "how_to_fix": "Update meta keywords to accurately reflect the page content. However, note that most search engines no longer use this tag for ranking.",
          "learn_more": "https://www.searchenginejournal.com/meta-keywords-seo/281041/"
        },
        "is_https": {
          "how_to_fix": "This is good! Ensure all internal links and resources also use HTTPS to maintain a secure connection.",
          "learn_more": "https://developers.google.com/search/docs/advanced/security/https"
        },
        "is_http": {
          "how_to_fix": "Migrate your site to HTTPS. Obtain an SSL certificate and update all internal links and resources to use HTTPS.",
          "learn_more": "https://developers.google.com/search/docs/advanced/security/https"
        },
        "title_too_long": {
          "how_to_fix": "Shorten your title tags to 50-60 characters. Ensure they're concise but descriptive of the page content.",
          "learn_more": "https://moz.com/learn/seo/title-tag"
        },
        "low_content_rate": {
          "how_to_fix": "Increase the amount of valuable, relevant content on the page. Aim for a good balance between content and HTML structure.",
          "learn_more": "https://www.searchenginejournal.com/word-count-seo/296675/"
        },
        "small_page_size": {
          "how_to_fix": "Add more valuable content to the page. Ensure the page provides comprehensive information on its topic.",
          "learn_more": "https://www.searchenginejournal.com/word-count-seo/296675/"
        },
        "no_h1_tag": {
          "how_to_fix": "Add an H1 tag to each page, containing the main topic or title of the page. Use only one H1 per page.",
          "learn_more": "https://www.searchenginejournal.com/h1-tag-seo-best-practices/313759/"
        },
        "recursive_canonical": {
          "how_to_fix": "Fix circular canonical references. Ensure each canonical tag points to the correct, final version of the page.",
          "learn_more": "https://www.searchenginejournal.com/canonical-url-tag/284625/"
        },
        "no_favicon": {
          "how_to_fix": "Create and add a favicon to your site. Use a .ico file and link to it in the <head> section of your HTML.",
          "learn_more": "https://css-tricks.com/favicon-quiz/"
        },
        "no_image_alt": {
          "how_to_fix": "Add descriptive alt text to all images. This helps search engines understand the image content and improves accessibility.",
          "learn_more": "https://moz.com/learn/seo/alt-text"
        },
        "no_image_title": {
          "how_to_fix": "Add title attributes to images where appropriate. While not as crucial as alt text, it can provide additional context.",
          "learn_more": "https://www.w3schools.com/tags/att_img_title.asp"
        },
        "seo_friendly_url": {
          "how_to_fix": "Create clean, descriptive URLs using keywords relevant to the page content. Use hyphens to separate words.",
          "learn_more": "https://moz.com/learn/seo/url"
        },
        "seo_friendly_url_characters_check": {
          "how_to_fix": "Remove special characters from URLs. Use only lowercase letters, numbers, and hyphens.",
          "learn_more": "https://www.searchenginejournal.com/technical-seo/url-structure/"
        },
        "seo_friendly_url_dynamic_check": {
          "how_to_fix": "Replace dynamic URLs with static, keyword-rich URLs. Use URL rewriting if necessary.",
          "learn_more": "https://yoast.com/seo-friendly-urls/"
        },
        "seo_friendly_url_keywords_check": {
          "how_to_fix": "Include relevant keywords in your URLs. Ensure they match the page title and content.",
          "learn_more": "https://ahrefs.com/blog/seo-friendly-urls/"
        },
        "seo_friendly_url_relative_length_check": {
          "how_to_fix": "Shorten URLs to less than 120 characters. Use concise, descriptive words.",
          "learn_more": "https://moz.com/learn/seo/url"
        },
        "title_too_short": {
          "how_to_fix": "Expand your title tags to at least 30 characters. Include relevant keywords and make them descriptive of the page content.",
          "learn_more": "https://moz.com/learn/seo/title-tag"
        },
        "no_content_encoding": {
          "how_to_fix": "Enable GZIP compression on your server to reduce file sizes and improve load times.",
          "learn_more": "https://web.dev/reduce-network-payloads-using-text-compression/"
        },
        "high_waiting_time": {
          "how_to_fix": "Optimize server response time. This may involve upgrading hosting, optimizing database queries, or implementing caching.",
          "learn_more": "https://web.dev/time-to-first-byte/"
        },
        "high_loading_time": {
          "how_to_fix": "Optimize page load speed by minimizing file sizes, leveraging browser caching, and using a content delivery network (CDN).",
          "learn_more": "https://web.dev/fast/"
        },
        "is_redirect": {
          "how_to_fix": "Minimize redirects where possible. Ensure all redirects are necessary and lead directly to the final destination.",
          "learn_more": "https://moz.com/learn/seo/redirection"
        },
        "is_broken": {
          "how_to_fix": "Fix or remove broken links. Ensure all links on your site lead to valid pages.",
          "learn_more": "https://www.searchenginejournal.com/fix-404-errors/307152/"
        },
        "is_4xx_code": {
          "how_to_fix": "Identify and fix client-side errors (like 404 Not Found). Either restore the missing content or redirect to a relevant page.",
          "learn_more": "https://www.searchenginejournal.com/fix-404-errors/307152/"
        },
        "is_5xx_code": {
          "how_to_fix": "Address server-side errors. This may involve fixing server configurations, scripts, or database issues.",
          "learn_more": "https://www.searchenginejournal.com/how-to-fix-500-internal-server-error/352907/"
        },
        "is_www": {
          "how_to_fix": "Choose either www or non-www version of your domain and redirect the other to it consistently.",
          "learn_more": "https://www.searchenginejournal.com/www-vs-non-www-urls/339113/"
        },
        "no_doctype": {
          "how_to_fix": "Add the appropriate DOCTYPE declaration to the beginning of each HTML page.",
          "learn_more": "https://www.w3schools.com/tags/tag_doctype.asp"
        },
        "no_encoding_meta_tag": {
          "how_to_fix": "Add a meta charset tag to the <head> section of your HTML. UTF-8 is recommended for most websites.",
          "learn_more": "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset"
        },
        "high_content_rate": {
          "how_to_fix": "Ensure your HTML is clean and efficient. Remove unnecessary markup and use CSS for styling.",
          "learn_more": "https://developers.google.com/speed/docs/insights/MinifyHTML"
        },
        "low_character_count": {
          "how_to_fix": "Add more valuable, relevant content to the page. Aim for at least 300 words of high-quality content.",
          "learn_more": "https://www.searchenginejournal.com/word-count-seo/296675/"
        },
        "high_character_count": {
          "how_to_fix": "Consider breaking very long content into multiple pages or use a clear structure with subheadings to improve readability.",
          "learn_more": "https://yoast.com/how-to-optimize-long-articles/"
        },
        "low_readability_rate": {
          "how_to_fix": "Simplify your content. Use shorter sentences, familiar words, and a clear structure to improve readability.",
          "learn_more": "https://yoast.com/readability-ranking/"
        },
        "irrelevant_title": {
          "how_to_fix": "Rewrite your title tags to accurately reflect the content of each page. Include relevant keywords where appropriate.",
          "learn_more": "https://moz.com/learn/seo/title-tag"
        },
        "deprecated_html_tags": {
          "how_to_fix": "Replace deprecated HTML tags with their modern equivalents or CSS styling.",
          "learn_more": "https://www.w3schools.com/tags/ref_html_dtd.asp"
        },
        "duplicate_title_tag": {
          "how_to_fix": "Ensure each page has only one title tag. Remove any duplicate tags.",
          "learn_more": "https://www.searchenginejournal.com/on-page-seo/title-tag/"
        },
        "no_title": {
          "how_to_fix": "Add a unique, descriptive title tag to each page. Keep it under 60 characters and include relevant keywords.",
          "learn_more": "https://moz.com/learn/seo/title-tag"
        },
        "flash": {
          "how_to_fix": "Replace Flash content with HTML5 alternatives. Most modern browsers no longer support Flash.",
          "learn_more": "https://developers.google.com/web/updates/2019/08/chrome-77-deps-rems#flash"
        },
        "lorem_ipsum": {
          "how_to_fix": "Replace all Lorem Ipsum placeholder text with real, valuable content relevant to your website.",
          "learn_more": "https://yoast.com/lorem-ipsum-lorem-damnum/"
        },
        "has_misspelling": {
          "how_to_fix": "Proofread your content and correct any spelling errors. Consider using a spell-checking tool.",
          "learn_more": "https://www.grammarly.com/blog/importance-proofreading-seo/"
        },
        "canonical_to_broken": {
          "how_to_fix": "Update canonical links to point to valid, existing pages. Remove or fix broken canonical references.",
          "learn_more": "https://www.searchenginejournal.com/canonical-url-tag/284625/"
        },
        "canonical_to_redirect": {
          "how_to_fix": "Update canonical links to point directly to the final destination URL, not to a redirect.",
          "learn_more": "https://www.searchenginejournal.com/canonical-url-tag/284625/"
        },
        "has_links_to_redirects": {
          "how_to_fix": "Update internal links to point directly to the final destination URL, not to a redirect.",
          "learn_more": "https://moz.com/learn/seo/redirection"
        },
        "is_orphan_page": {
          "how_to_fix": "Add internal links to orphan pages from relevant sections of your website.",
          "learn_more": "https://www.searchenginejournal.com/identify-remove-orphan-pages/287870/"
        },
        "has_meta_refresh_redirect": {
          "how_to_fix": "Replace meta refresh redirects with server-side 301 redirects for better SEO and user experience.",
          "learn_more": "https://www.searchenginejournal.com/meta-refresh-vs-301-redirect/270905/"
        },
        "meta_charset_consistency": {
          "how_to_fix": "Ensure all pages use the same character encoding, preferably UTF-8. Add a consistent meta charset tag to all pages.",
          "learn_more": "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset"
        },
        "size_greater_than_3mb": {
          "how_to_fix": "Reduce page size by optimizing images, minifying CSS and JavaScript, and removing unnecessary elements.",
          "learn_more": "https://web.dev/fast/"
        },
        "has_html_doctype": {
          "how_to_fix": "This is good! Ensure all pages have the correct HTML5 DOCTYPE declaration.",
          "learn_more": "https://www.w3schools.com/tags/tag_doctype.asp"
        },
        "https_to_http_links": {
          "how_to_fix": "Update all internal links to use HTTPS instead of HTTP to maintain a secure connection throughout the site.",
          "learn_more": "https://developers.google.com/search/docs/advanced/security/https"
        },
        "has_render_blocking_resources": {
          "how_to_fix": "Optimize CSS and JavaScript loading. Consider inlining critical CSS and deferring non-critical JavaScript.",
          "learn_more": "https://web.dev/render-blocking-resources/"
        },
        "redirect_chain": {
          "how_to_fix": "Minimize redirect chains. Update links to point directly to the final destination URL.",
          "learn_more": "https://www.searchenginejournal.com/redirect-chains-seo/339060/"
        }
    }