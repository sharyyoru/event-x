import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-12-01',
  useCdn: true,
})

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: any) {
  return builder.image(source)
}

// GROQ queries for common content types
export const queries = {
  // Get event landing page content
  eventPage: `*[_type == "eventPage" && slug.current == $slug][0] {
    title,
    slug,
    heroImage,
    description,
    "speakers": speakers[]-> {
      name,
      title,
      company,
      bio,
      photo
    },
    "sponsors": sponsors[]-> {
      name,
      logo,
      tier,
      website
    },
    schedule,
    faqs
  }`,

  // Get all speakers
  allSpeakers: `*[_type == "speaker"] | order(name asc) {
    _id,
    name,
    title,
    company,
    bio,
    photo,
    socialLinks
  }`,

  // Get all sponsors
  allSponsors: `*[_type == "sponsor"] | order(tier asc, name asc) {
    _id,
    name,
    logo,
    tier,
    website,
    description
  }`,

  // Get session content
  sessionContent: `*[_type == "session" && _id == $id][0] {
    title,
    description,
    "speakers": speakers[]-> {
      name,
      title,
      photo
    },
    materials,
    tags
  }`,
}

// Fetch helper
export async function fetchSanityContent<T>(
  query: string,
  params?: Record<string, any>
): Promise<T> {
  return sanityClient.fetch<T>(query, params)
}
