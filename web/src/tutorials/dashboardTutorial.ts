import type { Tutorial } from '@/types/tutorial.types';

export const dashboardTutorial: Tutorial = {
  id: 'dashboard',
  name: 'Dashboard Tutorial',
  description: 'Learn how to navigate and use the dashboard',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Prodigy! 👋',
      description:
        "We're excited to have you here! This quick tutorial will show you around the dashboard and help you get started. It'll only take a minute.",
      position: 'center',
    },
    {
      id: 'header',
      title: 'Navigation Header',
      description:
        'This is your main navigation bar. Use it to quickly access different sections of the platform, search for projects, and check your messages.',
      targetSelector: '[data-tutorial="header"]',
      position: 'bottom',
    },
    {
      id: 'post-project',
      title: 'Post a Project',
      description:
        'Need to hire talent? Click here to post a new project. You can describe your requirements, set a budget, and find the perfect freelancer for your needs.',
      targetSelector: '[data-tutorial="post-project-btn"]',
      position: 'bottom',
    },
    {
      id: 'projects-list',
      title: 'Your Projects',
      description:
        'This is where you\'ll see all your active projects. You can track progress, communicate with your team, and manage deliverables all in one place.',
      targetSelector: '[data-tutorial="projects-section"]',
      position: 'right',
    },
    {
      id: 'sidebar',
      title: 'Quick Actions & Updates',
      description:
        'The sidebar shows your recent activity, upcoming milestones, and quick actions. Stay on top of everything happening in your projects.',
      targetSelector: '[data-tutorial="right-sidebar"]',
      position: 'left',
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      description:
        'That\'s it! You now know the basics of navigating the dashboard. Feel free to explore and start creating amazing projects. Need help? Check out our help center anytime.',
      position: 'center',
    },
  ],
};
