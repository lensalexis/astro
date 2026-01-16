// mdx-components.tsx
import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allow using <Image /> directly inside MDX
    Image: (props) => <Image {...props} alt={props.alt || ''} />,
    // Resources placeholder component: <ImagePlaceholder />
    ImagePlaceholder: () => (
      <div
        aria-hidden="true"
        className="my-6 w-full overflow-hidden rounded-2xl border border-black/10 bg-gray-100"
      >
        <div className="flex items-center justify-center px-4 py-10 text-sm font-semibold text-gray-500">
          Image placeholder
        </div>
      </div>
    ),
    ...components,
  }
}