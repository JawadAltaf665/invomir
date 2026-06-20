import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { AppBottomTabs } from '@/src/components/navigation/AppBottomTabs';
import { AppMainHeader } from '@/src/components/navigation/AppMainHeader';
import { useAuthStore } from '@/src/store/auth-store';

export default function TabLayout() {
  const { t } = useTranslation();
  const status = useAuthStore((state) => state.status);

  if (status === 'bootstrapping') {
    return null;
  }

  if (status === 'anonymous') {
    return <Redirect href="/welcome" />;
  }

  return (
    <Tabs
      tabBar={(props) => <AppBottomTabs {...props} />}
      screenOptions={{
        header: () => <AppMainHeader />,
        headerShown: true,
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: t('tabs.invoices'),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('tabs.create'),
          href: null,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t('tabs.clients'),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('tabs.reports'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.profile'),
        }}
      />
      <Tabs.Screen
        name="settings-team"
        options={{
          href: null,
          title: 'Team Members',
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          href: null,
          title: t('more.subscription'),
        }}
      />
      <Tabs.Screen
        name="invoices/[id]"
        options={{
          href: null,
          title: t('invoices.detailTitle'),
        }}
      />
      <Tabs.Screen
        name="invoices/new"
        options={{
          href: null,
          title: t('invoices.create'),
        }}
      />
      <Tabs.Screen
        name="invoices/edit"
        options={{
          href: null,
          title: t('invoices.edit'),
        }}
      />
      <Tabs.Screen
        name="clients/[id]"
        options={{
          href: null,
          title: t('clients.detailTitle'),
        }}
      />
      <Tabs.Screen
        name="clients/new"
        options={{
          href: null,
          title: t('clients.add'),
        }}
      />
      <Tabs.Screen
        name="clients/edit"
        options={{
          href: null,
          title: t('clients.edit'),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          href: null,
          title: t('payments.title'),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: t('navigation.notifications'),
        }}
      />
    </Tabs>
  );
}
