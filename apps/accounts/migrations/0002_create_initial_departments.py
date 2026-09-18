from django.db import migrations


def create_initial_departments(apps, schema_editor):
    Department = apps.get_model('accounts', 'Department')
    initial_departments = [
        {
            'name': 'Engineering',
            'description': 'Software engineering, architecture, infrastructure, and technical operations.'
        },
        {
            'name': 'Design',
            'description': 'Product design, UI/UX research, user experience, and creative branding.'
        },
        {
            'name': 'Marketing',
            'description': 'Product marketing, community engagement, brand awareness, and growth.'
        },
        {
            'name': 'Sales',
            'description': 'Account management, business development, and client partnerships.'
        },
    ]
    for dept_data in initial_departments:
        Department.objects.get_or_create(
            name=dept_data['name'],
            defaults={'description': dept_data['description']}
        )


def remove_initial_departments(apps, schema_editor):
    Department = apps.get_model('accounts', 'Department')
    names = ['Engineering', 'Design', 'Marketing', 'Sales']
    Department.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_departments, reverse_code=remove_initial_departments),
    ]
