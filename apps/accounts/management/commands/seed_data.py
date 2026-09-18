from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import User, Department
from apps.kudos.models import Kudos, PointTransaction, TransactionType, CompanyValue
from apps.reactions.models import Reaction, ReactionType


class Command(BaseCommand):
    help = "Seeds initial demo data (departments, users, kudos, reactions, transactions) for evaluation."

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing demo data before seeding.',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting database seeding process..."))

        with transaction.atomic():
            # 1. Departments
            dept_eng, _ = Department.objects.get_or_create(
                name='Engineering',
                defaults={'description': 'Software Engineering and Infrastructure team'}
            )
            dept_design, _ = Department.objects.get_or_create(
                name='Design',
                defaults={'description': 'Product, UX and Brand Design team'}
            )
            dept_marketing, _ = Department.objects.get_or_create(
                name='Marketing',
                defaults={'description': 'Growth, Content and Product Marketing team'}
            )
            dept_sales, _ = Department.objects.get_or_create(
                name='Sales',
                defaults={'description': 'Enterprise and Mid-Market Sales team'}
            )

            # 2. Users
            default_password = "DemoUser123!"

            def create_or_update_user(email, name, dept, giving_allowance, earned_points, is_superuser=False):
                user, created = User.objects.get_or_create(
                    email=email.lower().strip(),
                    defaults={
                        'name': name,
                        'department': dept,
                        'giving_allowance': giving_allowance,
                        'earned_points': earned_points,
                        'is_email_verified': True,
                        'is_staff': is_superuser,
                        'is_superuser': is_superuser,
                    }
                )
                user.set_password(default_password)
                user.name = name
                user.department = dept
                user.giving_allowance = giving_allowance
                user.earned_points = earned_points
                user.is_email_verified = True
                user.is_staff = is_superuser
                user.is_superuser = is_superuser
                user.save()
                return user

            admin_user = create_or_update_user('admin@kudowall.com', 'Admin User', dept_eng, 100, 0, is_superuser=True)
            alice = create_or_update_user('alice@company.com', 'Alice Johnson', dept_eng, 70, 70)
            bob = create_or_update_user('bob@company.com', 'Bob Smith', dept_eng, 50, 90)
            charlie = create_or_update_user('charlie@company.com', 'Charlie Davis', dept_design, 80, 50)
            diana = create_or_update_user('diana@company.com', 'Diana Prince', dept_marketing, 90, 40)
            evan = create_or_update_user('evan@company.com', 'Evan Wright', dept_sales, 100, 30)

            # 3. Sample Kudos & Transactions
            sample_kudos_data = [
                {
                    'sender': alice,
                    'receiver': bob,
                    'points': 50,
                    'company_value': CompanyValue.INNOVATION,
                    'message': 'Outstanding work designing and implementing the asynchronous worker architecture! Truly high impact.',
                },
                {
                    'sender': bob,
                    'receiver': charlie,
                    'points': 50,
                    'company_value': CompanyValue.CUSTOMER_OBSESSION,
                    'message': 'The new UI design system is intuitive, accessible, and beloved by our end users!',
                },
                {
                    'sender': charlie,
                    'receiver': alice,
                    'points': 20,
                    'company_value': CompanyValue.TEAMWORK,
                    'message': 'Huge thanks for collaborating closely to bridge the gap between design tokens and React components.',
                },
                {
                    'sender': diana,
                    'receiver': alice,
                    'points': 50,
                    'company_value': CompanyValue.INNOVATION,
                    'message': 'Shipped the interactive analytics dashboard ahead of schedule for our annual press launch!',
                },
                {
                    'sender': alice,
                    'receiver': diana,
                    'points': 10,
                    'company_value': CompanyValue.TEAMWORK,
                    'message': 'Great cross-functional coordination on the product release announcement.',
                },
                {
                    'sender': evan,
                    'receiver': diana,
                    'points': 20,
                    'company_value': CompanyValue.CUSTOMER_OBSESSION,
                    'message': 'Customer case study deck was decisive in closing our biggest account of the quarter!',
                },
                {
                    'sender': charlie,
                    'receiver': evan,
                    'points': 20,
                    'company_value': CompanyValue.TEAMWORK,
                    'message': 'Thanks for sharing deep sales insights that helped clarify user persona priorities.',
                },
                {
                    'sender': bob,
                    'receiver': evan,
                    'points': 10,
                    'company_value': CompanyValue.INNOVATION,
                    'message': 'Great feedback on our automated quoting API integration.',
                },
                {
                    'sender': diana,
                    'receiver': bob,
                    'points': 20,
                    'company_value': CompanyValue.TEAMWORK,
                    'message': 'Thank you for unblocking the technical issues on the marketing site during the webinar!',
                },
                {
                    'sender': evan,
                    'receiver': bob,
                    'points': 20,
                    'company_value': CompanyValue.CUSTOMER_OBSESSION,
                    'message': 'Client was amazed by the fast turnaround time on the custom feature request.',
                },
            ]

            created_kudos = []
            for item in sample_kudos_data:
                kudo, created = Kudos.objects.get_or_create(
                    sender=item['sender'],
                    receiver=item['receiver'],
                    message=item['message'],
                    defaults={
                        'points': item['points'],
                        'company_value': item['company_value']
                    }
                )
                PointTransaction.objects.get_or_create(
                    kudo=kudo,
                    defaults={
                        'sender': item['sender'],
                        'receiver': item['receiver'],
                        'amount': item['points'],
                        'transaction_type': TransactionType.KUDO_TRANSFER,
                    }
                )
                created_kudos.append(kudo)

            # 4. Sample Reactions
            sample_reactions = [
                (created_kudos[0], charlie, ReactionType.FIRE),
                (created_kudos[0], diana, ReactionType.CLAP),
                (created_kudos[0], evan, ReactionType.PLUS_ONE),
                (created_kudos[1], alice, ReactionType.FIRE),
                (created_kudos[1], diana, ReactionType.CLAP),
                (created_kudos[2], bob, ReactionType.PLUS_ONE),
                (created_kudos[2], evan, ReactionType.CLAP),
                (created_kudos[3], bob, ReactionType.FIRE),
                (created_kudos[3], charlie, ReactionType.CLAP),
            ]

            for kudo, user, rx_type in sample_reactions:
                Reaction.objects.get_or_create(
                    kudo=kudo,
                    user=user,
                    reaction_type=rx_type
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded demo data:"))
        self.stdout.write(f" - Departments: {Department.objects.count()}")
        self.stdout.write(f" - Active Users: {User.objects.count()} (Password for all: '{default_password}')")
        self.stdout.write(f" - Admin User: 'admin@kudowall.com' (Password: '{default_password}')")
        self.stdout.write(f" - Kudos Created: {Kudos.objects.count()}")
        self.stdout.write(f" - Point Transactions: {PointTransaction.objects.count()}")
        self.stdout.write(f" - Reactions: {Reaction.objects.count()}")
