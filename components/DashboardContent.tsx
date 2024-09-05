import { ArrowPathIcon, CloudArrowUpIcon, LockClosedIcon } from '@heroicons/react/20/solid'
import { User } from '@supabase/supabase-js';
export default function DashboardContent({ user, userDetails }: {
    user: User; // Replace 'User' with the actual type of your user object
    userDetails: any; // Replace 'any' with the actual type of userDetails
}) {
    const features = [
      {
        name: 'Automated Keyword Research',
        description:
          "Uncover untapped opportunities with our SERP (Search Engine Results Page) driven keyword analysis. We'll identify high-potential keywords tailored to your business, giving you a head start on your SEO strategy.",
        icon: CloudArrowUpIcon,
      },
      {
        name: 'Keyword Clustering and Content Outline',
        description:
          "Let our advanced algorithms group your keywords into strategic clusters. We'll provide you with a roadmap for content creation, ensuring every piece serves a purpose in your SEO strategy.",
        icon: LockClosedIcon,
      },
      {
        name: 'Content Creation and SEO Domination',
        description:
          "Transform your outline into SEO-optimised content that ranks. Our AI assistant will guide you through creating engaging, high-quality content designed to dominate search results.",
        icon: ArrowPathIcon,
      },
    ]

    return (
        <div>
            <div className='flex flex-row flex-nowrap  gap-8 mb-8'>
                <div className='bg-white p-8 rounded-xl flex-1 flex-grow'>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-2xl text-center">
                        Let's get your SEO Audit underway
                    </h1>
                    <form action="#" method="POST" className="mx-auto mt-8 max-w-xl ">
            <label htmlFor="email" className="mt-6 text-lg leading-8 text-gray-600">
              Enter your website below and we will give you comprehensive insights into how your SEO is currently performing.
            </label>
            <div className="mt-2.5">
              <input
                id="domain"
                name="domain"
                type="domain"
                placeholder='e.g. https://espy-go.com'
                autoComplete="domain"
                className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
          </div>
        <div className="mt-4">
          <button
            type="submit"
            className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Start Audit
          </button>
        </div>
      </form>
                    </div>
                <div className='bg-white p-8 rounded-xl flex-1 flex-grow'></div>
            </div>
            <div className="bg-white py-16 sm:py-32 rounded-xl">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-600">Climb the rankings faster whilst you wait</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        We're on the cusp of revolutionising your SEO strategy
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                    Our platform is in its final stages of development. Whilst we put the finishing touches on Espy Go, let's kickstart your SEO journey with a comprehensive, free audit of your website.
                    </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <h2 className="text-center mb-8 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">It's as simple as</h2>
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature, count) => (
                        <div key={feature.name} className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                            <span aria-hidden="true" className="flex-none bg-indigo-600 w-16 h-16 content-center text-center text-4xl text-white rounded-full">{count + 1}</span>
                            {feature.name}
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                            <p className="flex-auto">{feature.description}</p>
                            </dd>
                        </div>
                        ))}
                    </dl>
                    </div>
                </div>
            </div>

        </div>
    )
}