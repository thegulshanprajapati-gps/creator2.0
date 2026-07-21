export type FieldType = 'text' | 'textarea' | 'richtext' | 'image' | 'json' | 'list' | 'select';

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  options?: string[];
  allowCustom?: boolean;
  itemFields?: FieldSchema[]; // used for 'list' type
}

export interface SectionSchema {
  key: string;
  label: string;
  description?: string;
  fields: FieldSchema[];
}

export const PAGE_SCHEMAS: Record<string, SectionSchema[]> = {
  home: [
    {
      key: 'hero',
      label: 'Hero Section',
      description: 'Configure the main landing section values that appear above the fold.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'INDUSTRY READY EDTECH' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'title', label: 'Main Title', type: 'richtext', placeholder: 'Learn skills that actually ship.' },
        { key: 'titleDarkColor', label: 'Title Color (Dark Mode)', type: 'text', placeholder: 'e.g. #ffffff' },
        { key: 'subtitle', label: 'Hero Subtitle', type: 'richtext', placeholder: 'XmartyCreator helps creators learn...' },
        { key: 'subtitleDarkColor', label: 'Subtitle Color (Dark Mode)', type: 'text', placeholder: 'e.g. #cbd5e1' },
        { key: 'image', label: 'Hero Asset', type: 'image' },
        { key: 'primaryCta', label: 'Primary Button Text', type: 'text', placeholder: 'Explore Courses' },
        { key: 'primaryCtaLink', label: 'Primary Button Link', type: 'text', placeholder: '/courses' },
        { key: 'secondaryCta', label: 'Secondary Button Text', type: 'text', placeholder: 'Join Community' },
        { key: 'secondaryCtaLink', label: 'Secondary Button Link', type: 'text', placeholder: '/community' },
        { key: 'loginCta', label: 'Login Button Text', type: 'text', placeholder: 'Login / Register' },
        { key: 'loginCtaLink', label: 'Login Button Link', type: 'text', placeholder: '/login' },
        { key: 'imageBadgeTitle', label: 'Hero Image Badge Title', type: 'text', placeholder: 'Vasant AI Mentor' },
        { key: 'imageBadgeSubtitle', label: 'Hero Image Badge Subtitle', type: 'text', placeholder: 'Always-on help for your learning path.' },
        { 
          key: 'stats', 
          label: 'Hero Statistics', 
          type: 'list',
          itemFields: [
            { key: 'metric', label: 'Stat Metric (e.g. 19,332+)', type: 'text' },
            { key: 'subtitle', label: 'Stat Subtitle (e.g. Happy Students)', type: 'text' },
            { key: 'icon', label: 'Icon Name (Users, BookOpen, Video, Award)', type: 'select', options: ['Users', 'BookOpen', 'Video', 'Award'] }
          ]
        },
        {
          key: 'carouselSlides',
          label: 'Mobile Hero Carousel Slides (Phone View Only)',
          type: 'list',
          itemFields: [
            { key: 'badge', label: 'Badge Text (e.g. BUILD & SHIP)', type: 'text' },
            { key: 'title', label: 'Slide Title', type: 'text' },
            { key: 'subtitle', label: 'Slide Subtitle / Description', type: 'textarea' },
            { key: 'ctaText', label: 'CTA Button Text', type: 'text' },
            { key: 'ctaLink', label: 'CTA Redirect Route (e.g. /courses)', type: 'text' },
            { key: 'colorStyle', label: 'Color Style', type: 'select', options: ['primary', 'indigo', 'emerald'] },
            { key: 'image', label: 'Slide Image Asset', type: 'image' }
          ]
        }
      ]
    },
    {
      key: 'pathways',
      label: 'Learning Pathways',
      description: 'Manage the learning pathways content section.',
      fields: [
        { key: 'tagText', label: 'Section Tag/Badge Text', type: 'text', placeholder: 'LEARNING PATH' },
        { key: 'tagBg', label: 'Section Tag Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'tagTextColor', label: 'Section Tag Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'tagBorderColor', label: 'Section Tag Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'tagBorderRadius', label: 'Section Tag Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'heading', label: 'Section Heading', type: 'richtext', placeholder: 'Everything connects.' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'richtext', placeholder: 'Courses, AI guidance, community practice...' },
        { 
          key: 'items', 
          label: 'Pathways Configuration', 
          type: 'list',
          itemFields: [
            { key: 'title', label: 'Pathway Title', type: 'richtext' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'icon', label: 'Icon Name (e.g. Code, Database)', type: 'text' },
            { key: 'color', label: 'Accent Color (e.g. bg-blue-500)', type: 'text' },
            { key: 'link', label: 'Redirect Route / Link', type: 'text', placeholder: '/courses' }
          ]
        }
      ]
    },
    {
      key: 'testimonials',
      label: 'Student Testimonials',
      description: 'Manage student testimonials and reviews.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'STUDENT REVIEWS' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'heading', label: 'Section Heading', type: 'richtext', placeholder: 'What our students say' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'richtext', placeholder: 'Real reviews from creators who built real projects.' },
        {
          key: 'list',
          label: 'Testimonials List',
          type: 'list',
          itemFields: [
            { key: 'name', label: 'Student Name', type: 'text' },
            { 
              key: 'role', 
              label: 'Student Role / Job', 
              type: 'select',
              options: ['student', 'visitor'],
              allowCustom: true
            },
            { key: 'avatar', label: 'Avatar Image', type: 'image' },
            { key: 'rating', label: 'Rating (e.g. 5)', type: 'text' },
            { key: 'review', label: 'Review Text', type: 'textarea' }
          ]
        }
      ]
    },
    {
      key: 'community',
      label: 'Community Section',
      description: 'Configure the community invitation section.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'COMMUNITY POWER' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'heading', label: 'Community Heading', type: 'richtext', placeholder: 'You do not learn alone here.' },
        { key: 'subtitle', label: 'Community Subtitle', type: 'richtext', placeholder: 'Get discussions, live reviews, creator circles...' },
        { key: 'cta', label: 'Explore Community Link Text', type: 'text', placeholder: 'Explore Community' },
        { 
          key: 'features', 
          label: 'Community Features List', 
          type: 'list',
          itemFields: [
            { key: 'label', label: 'Feature Name (e.g. Daily discussions)', type: 'text' },
            { key: 'icon', label: 'Icon Name (e.g. MessageSquare, BadgeCheck)', type: 'select', options: ['MessageSquare', 'BadgeCheck', 'GraduationCap', 'Users', 'Star'] }
          ]
        }
      ]
    },
    {
      key: 'impact',
      label: 'Our Impact by the Numbers',
      description: 'Configure the stats and impact numbers displayed on the landing page.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'PROVEN EXCELLENCE' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'heading', label: 'Section Heading', type: 'richtext', placeholder: 'Our Impact by the Numbers' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'richtext', placeholder: 'Join thousands of learners who are transforming their careers and skills' },
        {
          key: 'stats',
          label: 'Impact Statistics List',
          type: 'list',
          itemFields: [
            { key: 'value', label: 'Stat Metric (e.g. 19,332+)', type: 'text' },
            { key: 'label', label: 'Stat Subtitle (e.g. HAPPY STUDENTS)', type: 'text' },
            { key: 'icon', label: 'Icon Name (Users, BookOpen, Video, Award)', type: 'select', options: ['Users', 'BookOpen', 'Video', 'Award'] }
          ]
        }
      ]
    },
    {
      key: 'cta',
      label: 'Call-to-Action Section',
      description: 'Configure the primary landing page Call-to-Action banner.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'START YOUR JOURNEY' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'title', label: 'Heading Title', type: 'richtext', placeholder: 'Ready to Build & Ship Real Projects?' },
        { key: 'description', label: 'Description Text', type: 'textarea', placeholder: 'Get instant access to production-grade courses...' },
        { key: 'buttonText', label: 'CTA Button Text', type: 'text', placeholder: 'Start Learning Now' }
      ]
    },
    {
      key: 'seo',
      label: 'SEO Metadata',
      description: 'Configure SEO titles, descriptions, and keywords for search engines.',
      fields: [
        { key: 'title', label: 'Meta Title', type: 'text', placeholder: 'XmartyCreator - Learn Skills that Actually Ship' },
        { key: 'description', label: 'Meta Description', type: 'textarea', placeholder: 'XmartyCreator helps creators learn production-grade development, build real projects, and grow with AI guidance.' },
        { key: 'keywords', label: 'Meta Keywords', type: 'text', placeholder: 'edtech, courses, learning paths, AI guidance, engineering' }
      ]
    }
  ],
  about: [
    {
      key: 'hero',
      label: 'About Hero',
      description: 'The top section of the About page.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'WHO WE ARE' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'title', label: 'Page Title', type: 'richtext', placeholder: 'About XmartyCreator' },
        { key: 'subtitle', label: 'Subtitle', type: 'richtext' },
        { key: 'image', label: 'Hero Image', type: 'image' }
      ]
    },
    {
      key: 'story',
      label: 'Our Story',
      description: 'The main story content.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'OUR JOURNEY' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'heading', label: 'Story Heading', type: 'richtext' },
        { key: 'content', label: 'Story Content', type: 'richtext' }
      ]
    },
    {
      key: 'founder',
      label: 'Meet Our Founder',
      description: 'Configure the Founder section values.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'Meet Our Founder' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'name', label: 'Founder Name', type: 'text', placeholder: 'Mukesh Raj' },
        { key: 'title', label: 'Founder Title', type: 'text', placeholder: 'Founder & CEO, XmartyCreator' },
        { key: 'quote', label: 'Founder Quote', type: 'richtext', placeholder: '"Our mission is simple..."' },
        { key: 'bio', label: 'Founder Bio', type: 'richtext', placeholder: 'Mukesh Raj started...' },
        { key: 'back_text', label: 'Back Face Subtext', type: 'richtext', placeholder: 'We believe tech education is not about memorizing commands...' },
        { key: 'back_additional_text', label: 'Back Face Additional Subtext', type: 'richtext', placeholder: 'Additional paragraph describing our vision or goals...' },
        { key: 'image', label: 'Founder Image', type: 'image' },
        { key: 'twitter', label: 'Twitter URL', type: 'text', placeholder: 'https://twitter.com/...' },
        { key: 'linkedin', label: 'LinkedIn URL', type: 'text', placeholder: 'https://linkedin.com/in/...' },
        { key: 'github', label: 'GitHub URL', type: 'text', placeholder: 'https://github.com/...' }
      ]
    },
    {
      key: 'values',
      label: 'Our Values',
      description: 'The values section of the About page.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'OUR VALUES' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] }
      ]
    },
    {
      key: 'faq',
      label: 'FAQ Section',
      description: 'The FAQ section of the About page.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'FAQ' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] }
      ]
    },
    {
      key: 'seo',
      label: 'SEO Metadata',
      description: 'Configure SEO metadata for the About page.',
      fields: [
        { key: 'title', label: 'Meta Title', type: 'text', placeholder: 'About Us - XmartyCreator' },
        { key: 'description', label: 'Meta Description', type: 'textarea', placeholder: 'Learn about XmartyCreator, our story, mission, and how we help creators build real software.' },
        { key: 'keywords', label: 'Meta Keywords', type: 'text', placeholder: 'about us, mission, story, xmartycreator' }
      ]
    }
  ],
  courses: [
    {
      key: 'catalog',
      label: 'Catalog Headers',
      description: 'Headers for the curriculum catalog page.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'CURRICULUM' },
        { key: 'badgeBg', label: 'Badge Background Color', type: 'text', placeholder: 'e.g. #FF0000 or transparent' },
        { key: 'badgeTextColor', label: 'Badge Text Color', type: 'text', placeholder: 'e.g. #FFFFFF' },
        { key: 'badgeBorderColor', label: 'Badge Border Color', type: 'text', placeholder: 'e.g. #FF0000' },
        { key: 'badgeBorderRadius', label: 'Badge Border Radius', type: 'select', options: ['full', 'xl', 'lg', 'md', 'none'] },
        { key: 'title', label: 'Catalog Title', type: 'richtext', placeholder: 'Explore Our Curriculum' },
        { key: 'subtitle', label: 'Subtitle', type: 'richtext' }
      ]
    },
    {
      key: 'seo',
      label: 'SEO Metadata',
      description: 'Configure SEO metadata for the Curriculum page.',
      fields: [
        { key: 'title', label: 'Meta Title', type: 'text', placeholder: 'Curriculum - Explore Our Courses' },
        { key: 'description', label: 'Meta Description', type: 'textarea', placeholder: 'Explore the XmartyCreator curriculum. Practical frontend, backend, design and software courses.' },
        { key: 'keywords', label: 'Meta Keywords', type: 'text', placeholder: 'curriculum, coding courses, next.js, web development' }
      ]
    }
  ],
  footer: [
    {
      key: 'content',
      label: 'Footer Configuration',
      description: 'Global footer settings.',
      fields: [
        { key: 'aboutText', label: 'About Text', type: 'richtext' },
        { key: 'newsletterHeading', label: 'Newsletter Heading', type: 'richtext' }
      ]
    }
  ],
  contact: [
    {
      key: 'hero',
      label: 'Contact Hero',
      description: 'The top section of the Contact page.',
      fields: [
        { key: 'badge', label: 'Badge Text', type: 'text', placeholder: 'Get In Touch' },
        { key: 'title', label: 'Hero Title', type: 'richtext', placeholder: 'How can we help?' },
        { key: 'subtitle', label: 'Hero Subtitle', type: 'textarea', placeholder: 'Our orchestration support team...' }
      ]
    },
    {
      key: 'info',
      label: 'Platform Channels Heading',
      description: 'Heading for the contact channels section.',
      fields: [
        { key: 'heading', label: 'Heading Title', type: 'text', placeholder: 'Platform Channels' },
        { key: 'sub', label: 'Heading Subtitle', type: 'textarea', placeholder: 'Have direct questions regarding course catalogs...' }
      ]
    },
    {
      key: 'channels',
      label: 'Contact Channels',
      description: 'The specific contact channels.',
      fields: [
        { key: 'emailVal', label: 'Support Email Address', type: 'text', placeholder: 'hello@xmartycreator.com' },
        { key: 'emailDesc', label: 'Support Email Description', type: 'text', placeholder: 'Fast replies within 2-hour cycles.' },
        { key: 'phoneVal', label: 'Phone Number', type: 'text', placeholder: '+91 98765 43210' },
        { key: 'phoneDesc', label: 'Phone Description', type: 'text', placeholder: 'Available Mon-Fri (IST).' },
        { key: 'addressVal', label: 'Office Address', type: 'text', placeholder: 'Silicon Valley, Tech Hub Tower' },
        { key: 'addressDesc', label: 'Office Description', type: 'text', placeholder: 'Central AI management operations.' }
      ]
    },
    {
      key: 'ai',
      label: 'AI Agent Info',
      description: 'Information about the AI Agent in the contact section.',
      fields: [
        { key: 'title', label: 'AI Agent Title', type: 'text', placeholder: 'Vasant AI Agent' },
        { key: 'sub', label: 'AI Agent Subtitle', type: 'text', placeholder: 'Active 24/7. Monitoring ports.' }
      ]
    },
    {
      key: 'seo',
      label: 'SEO Metadata',
      description: 'Configure SEO metadata for the Contact page.',
      fields: [
        { key: 'title', label: 'Meta Title', type: 'text', placeholder: 'Contact Us - XmartyCreator' },
        { key: 'description', label: 'Meta Description', type: 'textarea', placeholder: 'Get in touch with the XmartyCreator support and admissions team.' },
        { key: 'keywords', label: 'Meta Keywords', type: 'text', placeholder: 'contact, support, help, email, address' }
      ]
    }
  ],
  megaquizzes: [
    {
      key: 'hero',
      label: 'Mega Quizzes Hero',
      description: 'Configure the landing content for Mega Quizzes.',
      fields: [
        { key: 'title', label: 'Main Title', type: 'text', placeholder: 'Xmarty Mega Live Quiz' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Register for the upcoming premium live assessment tracks...' },
        { key: 'bannerUrl', label: 'Banner Image', type: 'image' }
      ]
    },
    {
      key: 'seo',
      label: 'SEO Metadata',
      description: 'Configure SEO metadata for the Mega Quizzes page.',
      fields: [
        { key: 'title', label: 'Meta Title', type: 'text', placeholder: 'Mega Quizzes - XmartyCreator' },
        { key: 'description', label: 'Meta Description', type: 'textarea', placeholder: 'Register for the upcoming premium live assessment tracks.' },
        { key: 'keywords', label: 'Meta Keywords', type: 'text', placeholder: 'mega quiz, live assessment, coding test' }
      ]
    }
  ],
  community: [
    {
      key: 'hero',
      label: 'Hero Section',
      description: 'Configure the Hero section elements of the community page.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'Community HQ' },
        { key: 'title', label: 'Main Title', type: 'text', placeholder: 'Community' },
        { key: 'subtitle', label: 'Hero Subtitle', type: 'textarea', placeholder: 'Connects with social...' },
        { key: 'whatsappLink', label: 'WhatsApp Link', type: 'text', placeholder: 'https://chat.whatsapp.com/...' },
        { key: 'introLink', label: 'Watch Intro Link', type: 'text', placeholder: 'https://youtube.com/...' },
        { key: 'channelsStat', label: 'Channels Stat Text', type: 'text', placeholder: 'WhatsApp, Telegram, App' },
        { key: 'eventsStat', label: 'Live Events Stat Text', type: 'text', placeholder: 'Weekly sessions' }
      ]
    },
    {
      key: 'video',
      label: 'Intro Video Section',
      description: 'Configure the main introduction video embed URL.',
      fields: [
        { key: 'youtubeEmbedUrl', label: 'YouTube Embed URL', type: 'text', placeholder: 'https://www.youtube.com/embed/...' }
      ]
    },
    {
      key: 'hub',
      label: 'Community Hub Banner',
      description: 'Configure the Call-To-Action banner for the Community Hub.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'Coming soon' },
        { key: 'title', label: 'Banner Title', type: 'text', placeholder: 'Join our Community Hub' },
        { key: 'description', label: 'Banner Description', type: 'textarea', placeholder: 'A dedicated space for events, resources, and member shout-outs. Launching shortly.' },
        { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'Open hub' },
        { key: 'buttonLink', label: 'Button Link', type: 'text', placeholder: '#' }
      ]
    },
    {
      key: 'benefits',
      label: 'Benefits Section',
      description: 'Configure the headings for the benefits section.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'Why join our community' },
        { key: 'title', label: 'Heading Title', type: 'text', placeholder: 'Learn, build, and grow together' },
        { key: 'subtitle', label: 'Heading Subtitle', type: 'textarea', placeholder: 'Get instant updates, live doubt-solving, weekly challenges, and exclusive resources curated for you.' }
      ]
    },
    {
      key: 'channels',
      label: 'Channels Links & Info',
      description: 'Configure links and text for target channels.',
      fields: [
        { key: 'badgeText', label: 'Badge Text', type: 'text', placeholder: 'Join our communities' },
        { key: 'title', label: 'Heading Title', type: 'text', placeholder: 'Pick your favorite channel' },
        { key: 'subtitle', label: 'Heading Subtitle', type: 'textarea', placeholder: 'Choose where you want to stay connected with Xmarty Creator' },
        { key: 'whatsappLink', label: 'WhatsApp Join Link', type: 'text', placeholder: 'https://chat.whatsapp.com/...' },
        { key: 'appLink', label: 'App Download Link', type: 'text', placeholder: '#' },
        { key: 'telegramLink', label: 'Telegram Join Link', type: 'text', placeholder: 'https://t.me/...' },
        { key: 'youtubeLink', label: 'YouTube Subscribe Link', type: 'text', placeholder: 'https://youtube.com/...' }
      ]
    },
    {
      key: 'seo',
      label: 'SEO Metadata',
      description: 'Configure SEO metadata for the Community page.',
      fields: [
        { key: 'title', label: 'Meta Title', type: 'text', placeholder: 'Community - XmartyCreator' },
        { key: 'description', label: 'Meta Description', type: 'textarea', placeholder: 'Join the XmartyCreator community. Connect, learn, build and grow together.' },
        { key: 'keywords', label: 'Meta Keywords', type: 'text', placeholder: 'community, learning, coding, support' }
      ]
    }
  ]
};
