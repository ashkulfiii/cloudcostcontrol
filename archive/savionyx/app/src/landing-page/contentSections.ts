import type { NavigationItem } from '../client/components/NavBar/NavBar';
import { routes } from 'wasp/client/router';
import { DocsUrl, BlogUrl, AppUrl } from '../shared/common';
import daBoiAvatar from '../client/static/da-boi.webp';
import avatarPlaceholder from '../client/static/avatar-placeholder.webp';

export const landingPageNavigationItems: NavigationItem[] = [
  { name: 'App', to: routes.AppRoute.to },
  { name: 'Features', to: '#features' },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
  { name: 'Documentation', to: DocsUrl },
  { name: 'Blog', to: BlogUrl },
];
export const features = [
  {
    name: 'Historical Overview',
    description: 'Get a clear view of your past cloud spending with detailed graphs and charts.',
    icon: '📊',
    href: DocsUrl,
  },
  {
    name: 'Recurrent updates',
    description: 'Set a baseline for expected costs and receive alerts and recurring summaries of your cloud spend.',
    icon: '📉',
    href: DocsUrl,
  },
  {
    name: 'Forecasting',
    description: 'Receive accurate monthly and yearly forecasts based on previous usage patterns.',
    icon: '🔮',
    href: DocsUrl,
  },
  {
    name: 'Cost Optimization',
    description: 'Get actionable insights to reduce costs and optimize your cloud resources.',
    icon: '💡',
    href: DocsUrl,
  },
];

export const testimonials = [
  {
    name: 'Da Boi',
    role: 'Wasp Mascot',
    avatarSrc: daBoiAvatar,
    socialUrl: 'https://twitter.com/wasplang',
    quote: "I don't even know how to code. I'm just a plushie.",
  },
  {
    name: 'Mr. Foobar',
    role: 'Founder @ Cool Startup',
    avatarSrc: avatarPlaceholder,
    socialUrl: '',
    quote: 'This product makes me cooler than I already am.',
  },
  {
    name: 'Jamie',
    role: 'Happy Customer',
    avatarSrc: avatarPlaceholder,
    socialUrl: '#',
    quote: 'My cats love it!',
  },
];

export const faqs = [
  {
    id: 1,
    question: 'How does Savionyx help manage Azure cloud costs?',
    answer: '',
    href: DocsUrl,
  },
  {
    id: 2,
    question: 'Is my data secure with Savionyx?',
    answer: '',
    href: DocsUrl,
  },
  {
    id: 3,
    question: 'Can I customize my dashboard?',
    answer: '',
    href: DocsUrl,
  },
  {
    id: 4,
    question: 'What kind of support does Savionyx offer?',
    answer: '',
    href: DocsUrl,
  },
];


export const footerNavigation = {
  app: [
    { name: 'Documentation', href: DocsUrl },
    { name: 'Blog', href: BlogUrl },
  ],
  company: [
    { name: 'About', href: AppUrl },
    { name: 'Privacy', href: 'privacy-policy.pdf' },
    { name: 'Terms of Service', href: 'tos.pdf' },
  ],
};
