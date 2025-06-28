import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.savionyx.com',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Savionyx',
      customCss: ['./src/styles/tailwind.css'],
      description: 'Documentation for Savionyx.',
      logo: {
        src: '/src/assets/logo.webp',
        alt: 'Savionyx',
      },
      head: [
        // Add your script tags here. Below is an example for Google analytics, etc.
        {
          tag: 'script',
          attrs: {
            src: 'https://www.googletagmanager.com/gtag/js?id=<YOUR-GOOGLE-ANALYTICS-ID>',
          },
        },
        {
          tag: 'script',
          content: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        
          gtag('config', '<YOUR-GOOGLE-ANALYTICS-ID>');
          `,
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/<your-repo>',
      },
      components: {
        SiteTitle: './src/components/MyHeader.astro',
        ThemeSelect: './src/components/MyThemeSelect.astro',
        Head: './src/components/HeadWithOGImage.astro',
        PageTitle: './src/components/TitleWithBannerImage.astro',
      },
      social: {
        // github: 'https://github.com/wasp-lang/open-saas',
        // twitter: 'https://twitter.com/wasp_lang',
        // discord: 'https://discord.gg/aCamt5wCpS',
      },
      sidebar: [
        {
          label: 'Start Here',
          items: [
            {
              label: 'Introduction',
              link: '/',
            },
          ],
        },
        {
          label: 'Guides',
          items: [
            {
              label: 'Getting started',
              link: '/guides/onboarding/',
            },
          ],
        },
      ],
      plugins: [
        starlightBlog({
          title: 'Blog',
          customCss: ['./src/styles/tailwind.css'],
          authors: {
            Dev: {
              name: 'Dev',
              title: 'Dev @ Savionyx',
              picture: '/CRAIG_ROCK.png', // Images in the `public` directory are supported.
              url: 'https://blog.savionyx.com',
            },
          },
        }),
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
