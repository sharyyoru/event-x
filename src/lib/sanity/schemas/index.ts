// Sanity Schema Types Reference
// These schemas should be created in your Sanity Studio project

/*
To set up Sanity Studio, run:
npx create-sanity@latest

Then add these schemas to your sanity/schemas folder:

1. eventPage.ts - Event landing page content
2. speaker.ts - Speaker profiles
3. sponsor.ts - Sponsor information
4. session.ts - Session/talk details
5. faq.ts - FAQ items

Below are the schema definitions in Sanity format:
*/

export const eventPageSchema = {
  name: 'eventPage',
  title: 'Event Page',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Event Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'speakers',
      title: 'Featured Speakers',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'speaker' }] }],
    },
    {
      name: 'sponsors',
      title: 'Sponsors',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'sponsor' }] }],
    },
    {
      name: 'schedule',
      title: 'Schedule Overview',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'day', type: 'date', title: 'Day' },
            { name: 'title', type: 'string', title: 'Day Title' },
            { name: 'description', type: 'text', title: 'Description' },
          ],
        },
      ],
    },
    {
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'faq' }] }],
    },
  ],
}

export const speakerSchema = {
  name: 'speaker',
  title: 'Speaker',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'title',
      title: 'Job Title',
      type: 'string',
    },
    {
      name: 'company',
      title: 'Company',
      type: 'string',
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        { name: 'linkedin', type: 'url', title: 'LinkedIn' },
        { name: 'twitter', type: 'url', title: 'Twitter' },
        { name: 'website', type: 'url', title: 'Website' },
      ],
    },
  ],
}

export const sponsorSchema = {
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Company Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
    },
    {
      name: 'tier',
      title: 'Sponsorship Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Platinum', value: 'platinum' },
          { title: 'Gold', value: 'gold' },
          { title: 'Silver', value: 'silver' },
          { title: 'Bronze', value: 'bronze' },
        ],
      },
    },
    {
      name: 'website',
      title: 'Website',
      type: 'url',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
  ],
}

export const sessionSchema = {
  name: 'session',
  title: 'Session',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Session Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'speakers',
      title: 'Speakers',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'speaker' }] }],
    },
    {
      name: 'materials',
      title: 'Session Materials',
      type: 'array',
      of: [{ type: 'file' }],
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    },
  ],
}

export const faqSchema = {
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'General', value: 'general' },
          { title: 'Registration', value: 'registration' },
          { title: 'Venue', value: 'venue' },
          { title: 'Travel', value: 'travel' },
        ],
      },
    },
  ],
}
