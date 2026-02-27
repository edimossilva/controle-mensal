import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/owners',
      name: 'owner-list',
      component: () => import('@/views/owners/OwnerListView.vue'),
    },
    {
      path: '/owners/new',
      name: 'owner-create',
      component: () => import('@/views/owners/OwnerFormView.vue'),
    },
    {
      path: '/owners/:id/edit',
      name: 'owner-edit',
      component: () => import('@/views/owners/OwnerFormView.vue'),
    },
    {
      path: '/bank-accounts',
      name: 'bank-account-list',
      component: () => import('@/views/bank-accounts/BankAccountListView.vue'),
    },
    {
      path: '/bank-accounts/new',
      name: 'bank-account-create',
      component: () => import('@/views/bank-accounts/BankAccountFormView.vue'),
    },
    {
      path: '/bank-accounts/:id/edit',
      name: 'bank-account-edit',
      component: () => import('@/views/bank-accounts/BankAccountFormView.vue'),
    },
    {
      path: '/bank-accounts/:id/history',
      name: 'bank-account-history',
      component: () => import('@/views/bank-accounts/BankAccountHistoryView.vue'),
    },
    {
      path: '/transactions',
      name: 'transaction-list',
      component: () => import('@/views/transactions/TransactionListView.vue'),
    },
    {
      path: '/transactions/new',
      name: 'transaction-create',
      component: () => import('@/views/transactions/TransactionFormView.vue'),
    },
    {
      path: '/transactions/:id/edit',
      name: 'transaction-edit',
      component: () => import('@/views/transactions/TransactionFormView.vue'),
    },
    {
      path: '/payment-categories',
      name: 'payment-category-list',
      component: () => import('@/views/payment-categories/PaymentCategoryListView.vue'),
    },
    {
      path: '/payment-categories/new',
      name: 'payment-category-create',
      component: () => import('@/views/payment-categories/PaymentCategoryFormView.vue'),
    },
    {
      path: '/payment-categories/:id/edit',
      name: 'payment-category-edit',
      component: () => import('@/views/payment-categories/PaymentCategoryFormView.vue'),
    },
    {
      path: '/payment-templates',
      name: 'payment-template-list',
      component: () => import('@/views/payment-templates/PaymentTemplateListView.vue'),
    },
    {
      path: '/payment-templates/new',
      name: 'payment-template-create',
      component: () => import('@/views/payment-templates/PaymentTemplateFormView.vue'),
    },
    {
      path: '/payment-templates/:id/edit',
      name: 'payment-template-edit',
      component: () => import('@/views/payment-templates/PaymentTemplateFormView.vue'),
    },
    {
      path: '/payments',
      name: 'payment-list',
      component: () => import('@/views/payments/PaymentListView.vue'),
    },
    {
      path: '/payments/new',
      name: 'payment-create',
      component: () => import('@/views/payments/PaymentFormView.vue'),
    },
    {
      path: '/payments/:id/edit',
      name: 'payment-edit',
      component: () => import('@/views/payments/PaymentFormView.vue'),
    },
  ],
})

export default router
