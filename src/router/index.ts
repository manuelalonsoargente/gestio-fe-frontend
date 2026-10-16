import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    requiresPermission?: string
    guestOnly?: boolean
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true, title: 'Accés' },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: 'Panell' },
        },
        {
          path: 'usuaris',
          name: 'users',
          component: () => import('../views/UsersView.vue'),
          meta: { title: 'Usuaris', requiresPermission: 'gestionar-usuaris' },
        },
        {
          path: 'rols',
          name: 'roles',
          component: () => import('../views/RolesView.vue'),
          meta: { title: 'Rols', requiresPermission: 'gestionar-rols' },
        },
        {
          path: 'permisos',
          name: 'permissions',
          component: () => import('../views/PermissionsView.vue'),
          meta: { title: 'Permisos', requiresPermission: 'gestionar-permisos' },
        },
        {
          path: 'perfil',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
          meta: { title: 'El meu perfil' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'dashboard' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.status === 'unknown') {
    await auth.fetchMe()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresPermission && !auth.can(to.meta.requiresPermission)) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Gestió FE` : 'Gestió FE'
})

export default router
