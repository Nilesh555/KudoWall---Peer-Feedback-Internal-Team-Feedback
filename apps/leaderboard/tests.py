from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Department
from apps.kudos.models import Kudos, CompanyValue


class LeaderboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.eng_dept, _ = Department.objects.get_or_create(name='Engineering', defaults={'description': 'Engineering'})
        self.sales_dept, _ = Department.objects.get_or_create(name='Sales', defaults={'description': 'Sales'})

        self.alice = User.objects.create_user(email='alice@test.com', name='Alice Eng', password='Pass', department=self.eng_dept)
        self.bob = User.objects.create_user(email='bob@test.com', name='Bob Eng', password='Pass', department=self.eng_dept)
        self.charlie = User.objects.create_user(email='charlie@test.com', name='Charlie Sales', password='Pass', department=self.sales_dept)

        # Give kudos in current month
        # Bob gets 50 points
        Kudos.objects.create(sender=self.alice, receiver=self.bob, points=50, message='Super work', company_value=CompanyValue.INNOVATION)
        # Alice gets 20 points
        Kudos.objects.create(sender=self.bob, receiver=self.alice, points=20, message='Nice job', company_value=CompanyValue.TEAMWORK)

    def test_monthly_leaderboard_ranking(self):
        res = self.client.get('/api/leaderboard/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data['results']
        self.assertEqual(len(results), 3)

        # Bob should be rank 1 with 50 points
        self.assertEqual(results[0]['rank'], 1)
        self.assertEqual(results[0]['name'], 'Bob Eng')
        self.assertEqual(results[0]['monthly_points'], 50)

        # Alice should be rank 2 with 20 points
        self.assertEqual(results[1]['rank'], 2)
        self.assertEqual(results[1]['name'], 'Alice Eng')
        self.assertEqual(results[1]['monthly_points'], 20)

        # Charlie should be rank 3 with 0 points
        self.assertEqual(results[2]['rank'], 3)
        self.assertEqual(results[2]['monthly_points'], 0)

    def test_monthly_leaderboard_department_filter(self):
        res = self.client.get('/api/leaderboard/?department=Engineering')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['department'], 'Engineering')
        results = res.data['results']
        self.assertEqual(len(results), 2)
        names = [u['name'] for u in results]
        self.assertIn('Bob Eng', names)
        self.assertIn('Alice Eng', names)
        self.assertNotIn('Charlie Sales', names)

    def test_monthly_leaderboard_invalid_department(self):
        res = self.client.get('/api/leaderboard/?department=NonExistent')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('available_departments', res.data)

    def test_monthly_leaderboard_empty_department(self):
        empty_dept, _ = Department.objects.get_or_create(name='Marketing', defaults={'description': 'Marketing'})
        res = self.client.get('/api/leaderboard/?department=Marketing')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_participants'], 0)
        self.assertEqual(res.data['results'], [])
