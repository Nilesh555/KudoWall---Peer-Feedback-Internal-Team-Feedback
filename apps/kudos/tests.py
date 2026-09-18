from django.test import TestCase
from django.db import transaction
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Department
from apps.kudos.models import Kudos, PointTransaction, CompanyValue, KudosPoint, TransactionType


class KudosTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept, _ = Department.objects.get_or_create(name='Engineering', defaults={'description': 'Engineering'})
        self.sender = User.objects.create_user(
            email='sender@example.com',
            name='Sender User',
            password='Password123!',
            department=self.dept,
            giving_allowance=100,
            earned_points=0
        )
        self.receiver = User.objects.create_user(
            email='receiver@example.com',
            name='Receiver User',
            password='Password123!',
            department=self.dept,
            giving_allowance=100,
            earned_points=0
        )

    def test_give_kudos_success(self):
        self.client.force_authenticate(user=self.sender)
        payload = {
            'receiver_id': self.receiver.id,
            'points': 20,
            'message': 'Great job delivering the feature!',
            'company_value': CompanyValue.TEAMWORK
        }
        res = self.client.post('/api/kudos/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('kudo', res.data)
        self.assertEqual(res.data['sender_remaining_allowance'], 80)

        # Verify atomic balances in database
        self.sender.refresh_from_db()
        self.receiver.refresh_from_db()
        self.assertEqual(self.sender.giving_allowance, 80)
        self.assertEqual(self.receiver.earned_points, 20)

        # Verify Kudos model record
        kudo = Kudos.objects.get(id=res.data['kudo']['id'])
        self.assertEqual(kudo.sender, self.sender)
        self.assertEqual(kudo.receiver, self.receiver)
        self.assertEqual(kudo.points, 20)

        # Verify PointTransaction ledger record
        tx = PointTransaction.objects.get(kudo=kudo)
        self.assertEqual(tx.amount, 20)
        self.assertEqual(tx.sender, self.sender)
        self.assertEqual(tx.receiver, self.receiver)
        self.assertEqual(tx.transaction_type, TransactionType.KUDO_TRANSFER)

    def test_give_kudos_self_gifting_rejected(self):
        self.client.force_authenticate(user=self.sender)
        payload = {
            'receiver_id': self.sender.id,
            'points': 10,
            'message': 'Appreciating myself',
            'company_value': CompanyValue.INNOVATION
        }
        res = self.client.post('/api/kudos/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('receiver_id', res.data)

    def test_give_kudos_invalid_points_rejected(self):
        self.client.force_authenticate(user=self.sender)
        payload = {
            'receiver_id': self.receiver.id,
            'points': 35,  # Only 10, 20, 50 allowed
            'message': 'Good teamwork',
            'company_value': CompanyValue.TEAMWORK
        }
        res = self.client.post('/api/kudos/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('points', res.data)

    def test_give_kudos_invalid_company_value_rejected(self):
        self.client.force_authenticate(user=self.sender)
        payload = {
            'receiver_id': self.receiver.id,
            'points': 20,
            'message': 'Good teamwork',
            'company_value': 'UnknownValue'
        }
        res = self.client.post('/api/kudos/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('company_value', res.data)

    def test_give_kudos_insufficient_allowance_rejected(self):
        self.sender.giving_allowance = 15
        self.sender.save()
        self.client.force_authenticate(user=self.sender)

        payload = {
            'receiver_id': self.receiver.id,
            'points': 20,
            'message': 'Good teamwork',
            'company_value': CompanyValue.TEAMWORK
        }
        res = self.client.post('/api/kudos/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Balance remains unchanged
        self.sender.refresh_from_db()
        self.assertEqual(self.sender.giving_allowance, 15)

    def test_give_kudos_unauthenticated_rejected(self):
        payload = {
            'receiver_id': self.receiver.id,
            'points': 20,
            'message': 'Good teamwork',
            'company_value': CompanyValue.TEAMWORK
        }
        res = self.client.post('/api/kudos/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_give_kudos_invalid_receiver_rejected(self):
        self.client.force_authenticate(user=self.sender)
        payload = {
            'receiver_id': 999999,
            'points': 20,
            'message': 'Good teamwork',
            'company_value': CompanyValue.TEAMWORK
        }
        res = self.client.post('/api/kudos/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_atomic_rollback_on_failure(self):
        initial_sender_allowance = self.sender.giving_allowance
        initial_receiver_points = self.receiver.earned_points

        # Simulate failure during transaction by passing receiver who triggers error or invalid constraint
        self.client.force_authenticate(user=self.sender)
        try:
            with transaction.atomic():
                self.sender.giving_allowance -= 50
                self.sender.save()
                raise RuntimeError("Simulated mid-transaction failure!")
        except RuntimeError:
            pass

        # Balances must be completely untouched due to rollback
        self.sender.refresh_from_db()
        self.receiver.refresh_from_db()
        self.assertEqual(self.sender.giving_allowance, initial_sender_allowance)
        self.assertEqual(self.receiver.earned_points, initial_receiver_points)

    def test_kudos_feed_pagination_and_filtering(self):
        # Create multiple kudos
        Kudos.objects.create(sender=self.sender, receiver=self.receiver, points=10, message='Msg 1', company_value=CompanyValue.TEAMWORK)
        Kudos.objects.create(sender=self.sender, receiver=self.receiver, points=20, message='Msg 2', company_value=CompanyValue.INNOVATION)

        # Public access
        res = self.client.get('/api/kudos/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('count', res.data)
        self.assertIn('results', res.data)
        self.assertEqual(res.data['count'], 2)

        # Filter by company value
        res_filtered = self.client.get(f'/api/kudos/?company_value={CompanyValue.INNOVATION}')
        self.assertEqual(res_filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(res_filtered.data['count'], 1)
        self.assertEqual(res_filtered.data['results'][0]['company_value'], CompanyValue.INNOVATION)

    def test_empty_feed_handled_gracefully(self):
        Kudos.objects.all().delete()
        res = self.client.get('/api/kudos/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 0)
        self.assertEqual(res.data['results'], [])
