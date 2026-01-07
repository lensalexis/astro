// mdx-components.tsx
import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allow using <Image /> directly inside MDX
    Image: (props) => <Image {...props} alt={props.alt || ''} />,
    ...components,
  }
}