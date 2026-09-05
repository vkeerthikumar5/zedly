from django.db import models
from django.contrib.auth.models import AbstractUser

ROLE_CHOICES = (
    ('admin', 'Export House Admin'),
    ('subcontractor', 'Subcontractor'),
)

class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']
    
    def __str__(self):
        return self.email

    @property
    def is_admin_role(self):
        return self.role == 'admin'

    @property
    def is_subcontractor_role(self):
        return self.role == 'subcontractor'

    @property
    def profile_completion_percentage(self):
        if self.role == 'admin':
            return self.export_profile.get_completion_percentage() if hasattr(self, 'export_profile') else 0
        elif self.role == 'subcontractor':
            return self.subcontractor_profile.get_completion_percentage() if hasattr(self, 'subcontractor_profile') else 0
        return 0


class ExportHouseProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='export_profile')
    company_name = models.CharField(max_length=255, blank=True)
    gstin = models.CharField(max_length=50, blank=True)
    gstin_verified = models.BooleanField(default=False)
    corporate_address = models.TextField(blank=True)
    dispatch_hub = models.CharField(max_length=255, blank=True)
    company_stamp = models.ImageField(upload_to='stamps/', null=True, blank=True)
    authorized_signature = models.ImageField(upload_to='signatures/', null=True, blank=True)

    def get_completion_percentage(self):
        fields = [self.company_name, self.gstin, self.corporate_address, self.dispatch_hub]
        filled = sum([1 for f in fields if f])
        return int((filled / len(fields)) * 100) if len(fields) > 0 else 0


class SubcontractorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subcontractor_profile')
    workshop_name = models.CharField(max_length=255, blank=True)
    legal_name = models.CharField(max_length=255, blank=True)
    verification_doc_type = models.CharField(max_length=100, blank=True)
    id_number = models.CharField(max_length=100, blank=True)
    verification_status = models.CharField(max_length=50, default='UNVERIFIED')
    operating_location = models.CharField(max_length=255, blank=True)
    shipping_address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    contact_number = models.CharField(max_length=50, blank=True)
    primary_machinery = models.CharField(max_length=255, blank=True)
    active_machines = models.IntegerField(null=True, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    ifsc_code = models.CharField(max_length=50, blank=True)
    total_ratings = models.IntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)

    def get_completion_percentage(self):
        fields = [
            self.workshop_name, self.legal_name, self.verification_doc_type, self.id_number, 
            self.operating_location, self.primary_machinery, self.active_machines, 
            self.account_number, self.ifsc_code
        ]
        filled = sum([1 for f in fields if f])
        return int((filled / len(fields)) * 100) if len(fields) > 0 else 0


class Job(models.Model):
    PROCESS_CHOICES = (
        ('Weaving', 'Weaving'),
        ('Dyeing', 'Dyeing'),
        ('Printing', 'Printing'),
        ('Embroidery', 'Embroidery'),
        ('Stitching/Garmenting', 'Stitching/Garmenting'),
        ('Washing', 'Washing'),
        ('Finishing', 'Finishing'),
    )
    
    URGENCY_CHOICES = (
        ('Normal', 'Normal'),
        ('Urgent', 'Urgent'),
        ('Immediate Dispatch', 'Immediate Dispatch'),
    )
    
    UNIT_CHOICES = (
        ('Meters', 'Meters'),
        ('Kgs', 'Kgs'),
        ('Pieces', 'Pieces'),
        ('Rolls', 'Rolls'),
        ('Yards', 'Yards'),
    )
    
    STATUS_CHOICES = (
        ('Open', 'Open'),
        ('Closed', 'Closed'),
    )

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=255)
    process_type = models.CharField(max_length=100)
    urgency_level = models.CharField(max_length=50, choices=URGENCY_CHOICES)
    raw_material_provided = models.CharField(max_length=255)
    total_quantity = models.FloatField()
    unit_of_measurement = models.CharField(max_length=50, choices=UNIT_CHOICES)
    expected_delivery_date = models.DateField()
    pickup_delivery_location = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget_negotiable = models.BooleanField(default=False)
    bidding_start_time = models.DateTimeField(null=True, blank=True)
    bidding_end_time = models.DateTimeField(null=True, blank=True)
    visible_from_time = models.DateTimeField(null=True, blank=True)
    technical_specifications = models.TextField(blank=True)
    design_document = models.FileField(upload_to='job_designs/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    completed_at = models.DateTimeField(null=True, blank=True)
    completion_proof = models.ImageField(upload_to='completion_proofs/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class JobBid(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='bids')
    subcontractor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='placed_bids')
    quoted_price = models.DecimalField(max_digits=12, decimal_places=2)
    delivery_date = models.DateField()
    capacity_allocation = models.CharField(max_length=100)
    remarks = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Pending') # Pending, Accepted, Rejected
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Bid by {self.subcontractor.username} for {self.job.title}"

class Challan(models.Model):
    export_house = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issued_challans')
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
    challan_number = models.CharField(max_length=100, unique=True)
    subcontractor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='received_challans')
    
    subcontractor_name = models.CharField(max_length=255)
    subcontractor_id_type = models.CharField(max_length=100)
    subcontractor_id_number = models.CharField(max_length=100)
    destination_address = models.TextField(blank=True)
    subcontractor_contact_person = models.CharField(max_length=255, blank=True)
    subcontractor_contact_number = models.CharField(max_length=50, blank=True)
    
    mode_of_transport = models.CharField(max_length=100, blank=True)
    vehicle_number = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=50, default='Draft') 
    gate_in_timestamp = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    return_challan_generated = models.BooleanField(default=False)
    
    # Rating & Feedback
    rating = models.IntegerField(null=True, blank=True)
    comments = models.TextField(blank=True)

    def __str__(self):
        return self.challan_number

class ChallanMaterial(models.Model):
    challan = models.ForeignKey(Challan, on_delete=models.CASCADE, related_name='materials')
    description = models.CharField(max_length=255)
    hsn_code = models.CharField(max_length=100)
    quantity = models.FloatField()
    unit = models.CharField(max_length=50)
    taxable_value_per_unit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.quantity} {self.unit} of {self.description}"
