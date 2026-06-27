from apps.accounts.models import User

if not User.objects.filter(email='opb@eformular.gov.al').exists():
    User.objects.create_user(
        email='opb@eformular.gov.al',
        password='Opb2026!',
        full_name='Elira Kola',
        role='OPB'
    )
    print('OPB user created')

if not User.objects.filter(email='ak@eformular.gov.al').exists():
    User.objects.create_user(
        email='ak@eformular.gov.al',
        password='Ak2026!',
        full_name='Blerina Hoxha',
        role='AK'
    )
    print('AK user created')

print('Done. Users:', list(User.objects.values('email', 'role', 'full_name')))
