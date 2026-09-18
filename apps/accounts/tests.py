from django.test import TestCase
from django.urls import reverse
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from apps.accounts.models import User, Department
from apps.kudos.models import Kudos, CompanyValue, KudosPoint


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept, _ = Department.objects.get_or_create(name='Engineering', defaults={'description': 'Tech team'})
        self.design_dept, _ = Department.objects.get_or_create(name='Design', defaults={'description': 'Creative team'})
        self.user_password = 'TestPassword123!'
        self.user = User.objects.create_user(
            email='alice@example.com',
            name='Alice Wonderland',
            password=self.user_password,
            department=self.dept,
            giving_allowance=100,
            earned_points=0,
            is_email_verified=True
        )

    def test_signup_success(self):
        payload = {
            'name': 'Charlie Developer',
            'email': 'charlie@example.com',
            'password': 'SecurePassword123!',
            'department_id': self.dept.id
        }
        res = self.client.post('/api/accounts/signup/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('verification_simulation', res.data)
        self.assertIn('verification_token', res.data['verification_simulation'])
        self.assertTrue(User.objects.filter(email='charlie@example.com').exists())
        charlie = User.objects.get(email='charlie@example.com')
        self.assertFalse(charlie.is_email_verified)
        self.assertEqual(charlie.giving_allowance, 100)
        self.assertEqual(charlie.earned_points, 0)

    def test_signup_duplicate_email(self):
        payload = {
            'name': 'Alice Copy',
            'email': 'alice@example.com',
            'password': 'SecurePassword123!',
            'department_id': self.dept.id
        }
        res = self.client.post('/api/accounts/signup/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.data)

    def test_email_verification_simulation(self):
        user = User.objects.create_user(
            email='unverified@example.com',
            name='Unverified User',
            password='Password123!',
            is_email_verified=False,
            email_verification_token='test-token-123'
        )
        res = self.client.post('/api/accounts/verify-email/', data={
            'email': 'unverified@example.com',
            'token': 'test-token-123'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)

    def test_login_valid(self):
        res = self.client.post('/api/accounts/login/', data={
            'email': 'alice@example.com',
            'password': self.user_password
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', res.data)
        self.assertIn('access_token', res.cookies)
        self.assertIn('refresh_token', res.cookies)
        self.assertTrue(res.cookies['refresh_token']['httponly'])

    def test_login_invalid_credentials(self):
        res = self.client.post('/api/accounts/login/', data={
            'email': 'alice@example.com',
            'password': 'WrongPassword999'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res_unknown = self.client.post('/api/accounts/login/', data={
            'email': 'ghost@example.com',
            'password': self.user_password
        })
        self.assertEqual(res_unknown.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_token_rotation(self):
        login_res = self.client.post('/api/accounts/login/', data={
            'email': 'alice@example.com',
            'password': self.user_password
        })
        initial_refresh = login_res.cookies['refresh_token'].value

        # Refresh using cookie
        self.client.cookies = login_res.cookies
        refresh_res = self.client.post('/api/accounts/token/refresh/')
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', refresh_res.data)
        new_refresh = refresh_res.cookies['refresh_token'].value
        self.assertNotEqual(initial_refresh, new_refresh)

        # Old refresh token should be blacklisted now
        self.client.cookies.clear()
        old_token_res = self.client.post('/api/accounts/token/refresh/', data={'refresh': initial_refresh})
        self.assertEqual(old_token_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout(self):
        login_res = self.client.post('/api/accounts/login/', data={
            'email': 'alice@example.com',
            'password': self.user_password
        })
        refresh_val = login_res.cookies['refresh_token'].value
        self.client.cookies = login_res.cookies

        logout_res = self.client.post('/api/accounts/logout/')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)
        self.assertEqual(logout_res.cookies['access_token'].value, '')
        self.assertEqual(logout_res.cookies['refresh_token'].value, '')

        # Attempting to refresh with old logged out token fails
        fail_res = self.client.post('/api/accounts/token/refresh/', data={'refresh': refresh_val})
        self.assertEqual(fail_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forgot_and_reset_password(self):
        res_forgot = self.client.post('/api/accounts/forgot-password/', data={'email': 'alice@example.com'})
        self.assertEqual(res_forgot.status_code, status.HTTP_200_OK)
        sim = res_forgot.data['simulation']
        uidb64 = sim['uidb64']
        token = sim['token']

        # Reset password
        res_reset = self.client.post('/api/accounts/reset-password/', data={
            'uidb64': uidb64,
            'token': token,
            'new_password': 'BrandNewPassword999!'
        })
        self.assertEqual(res_reset.status_code, status.HTTP_200_OK)

        # Old password fails
        res_old = self.client.post('/api/accounts/login/', data={'email': 'alice@example.com', 'password': self.user_password})
        self.assertEqual(res_old.status_code, status.HTTP_400_BAD_REQUEST)

        # New password succeeds
        res_new = self.client.post('/api/accounts/login/', data={'email': 'alice@example.com', 'password': 'BrandNewPassword999!'})
        self.assertEqual(res_new.status_code, status.HTTP_200_OK)

    def test_protected_profile_api(self):
        # Unauthenticated access rejected
        res_unauth = self.client.get('/api/profile/')
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated access
        self.client.force_authenticate(user=self.user)
        res_auth = self.client.get('/api/profile/')
        self.assertEqual(res_auth.status_code, status.HTTP_200_OK)
        self.assertEqual(res_auth.data['email'], 'alice@example.com')
        self.assertIn('givingAllowance', res_auth.data)
        self.assertIn('earnedPoints', res_auth.data)
        self.assertIn('stats', res_auth.data)
        self.assertIn('earned_badges', res_auth.data)
        self.assertNotIn('password', res_auth.data)

    def test_user_autocomplete_and_search(self):
        bob = User.objects.create_user(email='bob@example.com', name='Bob Builder', password='Pass', department=self.design_dept)
        self.client.force_authenticate(user=self.user)

        # Search by name
        res_search = self.client.get('/api/users/?search=Builder')
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        names = [u['name'] for u in res_search.data['results']]
        self.assertIn('Bob Builder', names)

        # Exclude self verification
        res_exclude = self.client.get('/api/users/?exclude_self=true')
        user_ids = [u['id'] for u in res_exclude.data['results']]
        self.assertNotIn(self.user.id, user_ids)
        self.assertIn(bob.id, user_ids)

    def test_reset_allowances_management_command(self):
        self.user.giving_allowance = 40
        self.user.save()
        bob = User.objects.create_user(email='bob2@example.com', name='Bob Two', password='Pass', giving_allowance=20)

        call_command('reset_allowances')

        self.user.refresh_from_db()
        bob.refresh_from_db()
        self.assertEqual(self.user.giving_allowance, 100)
        self.assertEqual(bob.giving_allowance, 100)
