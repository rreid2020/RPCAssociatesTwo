import imageUrlBuilder from '@sanity/image-url'
import { SanityImage } from './types'
import { client } from './client'

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImage | undefined) {
  if (!source || !source.asset) {
    return null
  }
  return builder.image(source)
}

export function urlForWithSize(
  source: SanityImage | undefined,
  width: number,
  height?: number
) {
  if (!source || !source.asset) {
    return null
  }
  const image = builder.image(source)
  if (height) {
    return image.width(width).height(height).url()
  }
  return image.width(width).url()
}

