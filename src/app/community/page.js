'use client';

import ComingSoon from '@/components/common/ComingSoon';

export default function CommunityPage() {
  return (
    <ComingSoon
      title="Our Community is Growing!"
      icon="ti-world"
      description="This patch of land isn't ready for harvest yet. We're preparing fertile ground for our farming community to flourish."
      features={[
        { icon: 'ti-user', text: 'Connect with Local Farmers' },
        { icon: 'ti-map-alt', text: 'Find Nearby Fresh Produce' },
        { icon: 'ti-comments', text: 'Share Farming Knowledge' },
        { icon: 'ti-calendar', text: 'Join Local Farm Events' }
      ]}
      backLink="/"
      backText="Return to Fresh Vegetables"
      backIcon="ti-shopping-cart"
    />
  );
}