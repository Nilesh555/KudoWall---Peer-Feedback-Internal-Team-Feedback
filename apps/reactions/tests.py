from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Department
from apps.kudos.models import Kudos, CompanyValue
from apps.reactions.models import Reaction, ReactionType


class ReactionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept, _ = Department.objects.get_or_create(name='Design', defaults={'description': 'Design'})
        self.sender = User.objects.create_user(email='s@example.com', name='Sender', password='Pass', department=self.dept)
        self.receiver = User.objects.create_user(email='r@example.com', name='Receiver', password='Pass', department=self.dept)
        self.reactor = User.objects.create_user(email='reactor@example.com', name='Reactor', password='Pass', department=self.dept)
        self.kudo = Kudos.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            points=20,
            message='Awesome design work!',
            company_value=CompanyValue.CUSTOMER_OBSESSION
        )

    def test_add_reaction_success(self):
        self.client.force_authenticate(user=self.reactor)
        res = self.client.post(f'/api/kudos/{self.kudo.id}/reactions/', data={'reaction_type': '+1'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['reaction_counts']['+1'], 1)
        self.assertIn('+1', res.data['user_reactions'])
        self.assertEqual(res.data['total_reactions'], 1)

    def test_duplicate_reaction_prevented(self):
        self.client.force_authenticate(user=self.reactor)
        # First reaction
        res1 = self.client.post(f'/api/kudos/{self.kudo.id}/reactions/', data={'reaction_type': '+1'})
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Duplicate reaction of same emoji
        res2 = self.client.post(f'/api/kudos/{self.kudo.id}/reactions/', data={'reaction_type': '+1'})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res2.data)

    def test_multiple_different_reactions_allowed(self):
        self.client.force_authenticate(user=self.reactor)
        res1 = self.client.post(f'/api/kudos/{self.kudo.id}/reactions/', data={'reaction_type': '+1'})
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(f'/api/kudos/{self.kudo.id}/reactions/', data={'reaction_type': ReactionType.FIRE})
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data['total_reactions'], 2)

    def test_remove_reaction_success(self):
        self.client.force_authenticate(user=self.reactor)
        self.client.post(f'/api/kudos/{self.kudo.id}/reactions/', data={'reaction_type': '+1'})

        # Delete reaction
        res_del = self.client.delete(f'/api/kudos/{self.kudo.id}/reactions/', data={'reaction_type': '+1'})
        self.assertEqual(res_del.status_code, status.HTTP_200_OK)
        self.assertEqual(res_del.data['reaction_counts']['+1'], 0)
        self.assertNotIn('+1', res_del.data['user_reactions'])
        self.assertEqual(res_del.data['total_reactions'], 0)

    def test_unauthenticated_reaction_rejected(self):
        res = self.client.post(f'/api/kudos/{self.kudo.id}/reactions/', data={'reaction_type': '+1'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
