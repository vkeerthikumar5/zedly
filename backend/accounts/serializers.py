from rest_framework import serializers
from .models import User, ExportHouseProfile, SubcontractorProfile, Job, JobBid, Challan, ChallanMaterial
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    profile_completion_percentage = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'profile_completion_percentage')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'role', 'username', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        if user.role == 'admin':
            ExportHouseProfile.objects.create(user=user)
        elif user.role == 'subcontractor':
            SubcontractorProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data.get('email'), password=data.get('password'))
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect Credentials")


class ExportHouseProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportHouseProfile
        exclude = ('user',)

    def validate_gstin(self, value):
        if not value:
            return value
        value = value.strip().upper()
        
        qs1 = ExportHouseProfile.objects.filter(gstin=value)
        if self.instance and self.instance.pk:
            qs1 = qs1.exclude(pk=self.instance.pk)
        if qs1.exists():
            raise serializers.ValidationError("GSTIN already registered in Zetly!")
            
        qs2 = SubcontractorProfile.objects.filter(verification_doc_type='GSTIN', id_number=value)
        if qs2.exists():
            raise serializers.ValidationError("GSTIN already registered in Zetly!")
            
        return value


class SubcontractorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubcontractorProfile
        exclude = ('user',)

    def validate(self, data):
        doc_type = data.get('verification_doc_type')
        id_num = data.get('id_number')
        
        if doc_type == 'GSTIN' and id_num:
            id_num = id_num.strip().upper()
            qs1 = SubcontractorProfile.objects.filter(verification_doc_type='GSTIN', id_number=id_num)
            if self.instance and self.instance.pk:
                qs1 = qs1.exclude(pk=self.instance.pk)
            if qs1.exists():
                raise serializers.ValidationError({"id_number": "GSTIN already registered in Zetly!"})
            
            qs2 = ExportHouseProfile.objects.filter(gstin=id_num)
            if qs2.exists():
                raise serializers.ValidationError({"id_number": "GSTIN already registered in Zetly!"})
                
        return data


class JobSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    company_name = serializers.SerializerMethodField()
    exporter_verified = serializers.SerializerMethodField()
    export_house_signature = serializers.SerializerMethodField()
    my_bid = serializers.SerializerMethodField()
    awarded_bid = serializers.SerializerMethodField()
    has_challan = serializers.SerializerMethodField()
    gate_in_challan = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('owner', 'status', 'created_at')

    def get_company_name(self, obj):
        if hasattr(obj.owner, 'export_profile') and obj.owner.export_profile.company_name:
            return obj.owner.export_profile.company_name
        return obj.owner.email or obj.owner.username

    def get_has_challan(self, obj):
        from .models import Challan
        return Challan.objects.filter(job=obj).exists()

    def get_gate_in_challan(self, obj):
        from .models import Challan
        from .serializers import ChallanSerializer
        c = Challan.objects.filter(job=obj, status='Gate-In Verified').first()
        if c:
            return ChallanSerializer(c).data
        return None

    def get_exporter_verified(self, obj):
        if hasattr(obj.owner, 'export_profile'):
            return obj.owner.export_profile.gstin_verified
        return False

    def get_export_house_signature(self, obj):
        if hasattr(obj.owner, 'export_profile') and obj.owner.export_profile.authorized_signature:
            request = self.context.get('request')
            photo_url = obj.owner.export_profile.authorized_signature.url
            if request:
                return request.build_absolute_uri(photo_url)
            return "http://localhost:8000" + photo_url
        return None

    def get_awarded_bid(self, obj):
        from .models import JobBid
        bid = JobBid.objects.filter(job=obj, status='Accepted').first()
        if bid:
            # Resolve sub name and details
            sub_name = bid.subcontractor.username
            doc_type = 'GSTIN'
            id_num = ''
            dest_address = ''
            contact_p = ''
            contact_n = ''
            
            if hasattr(bid.subcontractor, 'subcontractor_profile'):
                prof = bid.subcontractor.subcontractor_profile
                if prof.workshop_name:
                    sub_name = prof.workshop_name
                if prof.verification_doc_type:
                    doc_type = prof.verification_doc_type
                if prof.id_number:
                    id_num = prof.id_number
                if prof.shipping_address:
                    dest_address = prof.shipping_address
                elif prof.operating_location:
                    dest_address = prof.operating_location
                if prof.contact_person:
                    contact_p = prof.contact_person
                if prof.contact_number:
                    contact_n = prof.contact_number
                
                v_status = prof.verification_status
            
            return {
                "id": bid.id,
                "subcontractor_name": sub_name,
                "subcontractor_id_type": doc_type,
                "subcontractor_id_number": id_num,
                "destination_address": dest_address,
                "subcontractor_contact_person": contact_p,
                "subcontractor_contact_number": contact_n,
                "quoted_price": str(bid.quoted_price),
                "delivery_date": str(bid.delivery_date),
                "verification_status": v_status,
                "verification_doc_type": doc_type,
            }
        return None

    def get_my_bid(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'subcontractor':
            from .models import JobBid
            bid = JobBid.objects.filter(job=obj, subcontractor=request.user).first()
            if bid:
                # Can't use JobBidSerializer directly here without circular imports if not careful, but we can return dict
                return {
                    "id": bid.id,
                    "quoted_price": str(bid.quoted_price),
                    "delivery_date": str(bid.delivery_date),
                    "capacity_allocation": bid.capacity_allocation,
                    "remarks": bid.remarks,
                    "status": bid.status
                }
        return None

    def validate(self, data):
        from datetime import timedelta
        bidding_start = data.get('bidding_start_time')
        bidding_end = data.get('bidding_end_time')
        visible_from = data.get('visible_from_time')

        if not bidding_start:
            raise serializers.ValidationError({"bidding_start_time": "Bidding start time is required."})
        if not bidding_end:
            raise serializers.ValidationError({"bidding_end_time": "Bidding end time is required."})
        if not visible_from:
            raise serializers.ValidationError({"visible_from_time": "Visibility start time is required."})

        if bidding_start >= bidding_end:
            raise serializers.ValidationError({"bidding_end_time": "Bidding end time must be after the bidding start time."})

        margin = bidding_start - visible_from
        if margin < timedelta(minutes=30):
            raise serializers.ValidationError({
                "visible_from_time": "Visibility start time must be configured to be at least 30 minutes before the bidding start time."
            })

        return data

class JobBidSerializer(serializers.ModelSerializer):
    subcontractor_name = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    verification_status = serializers.SerializerMethodField()
    verification_doc_type = serializers.SerializerMethodField()
    
    class Meta:
        model = JobBid
        fields = '__all__'
        read_only_fields = ('job', 'subcontractor', 'status', 'created_at')

    def get_subcontractor_name(self, obj):
        if hasattr(obj.subcontractor, 'subcontractor_profile') and obj.subcontractor.subcontractor_profile.workshop_name:
            return obj.subcontractor.subcontractor_profile.workshop_name
        return obj.subcontractor.username

    def get_rating(self, obj):
        # We don't have a ratings table yet, return mock 4.8 for UI purposes, later dynamic.
        return 4.8

    def get_verification_status(self, obj):
        if hasattr(obj.subcontractor, 'subcontractor_profile'):
            return obj.subcontractor.subcontractor_profile.verification_status
        return 'UNVERIFIED'

    def get_verification_doc_type(self, obj):
        if hasattr(obj.subcontractor, 'subcontractor_profile'):
            return obj.subcontractor.subcontractor_profile.verification_doc_type
        return ''

class ChallanMaterialSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False, read_only=False) # So we can update existing ones if needed later

    class Meta:
        model = ChallanMaterial
        fields = '__all__'
        read_only_fields = ('challan',)

class ChallanSerializer(serializers.ModelSerializer):
    materials = ChallanMaterialSerializer(many=True, required=False)
    export_house_name = serializers.SerializerMethodField()
    export_house_address = serializers.SerializerMethodField()
    export_house_gstin = serializers.SerializerMethodField()
    job_name = serializers.SerializerMethodField()
    export_house_signature = serializers.SerializerMethodField()
    
    class Meta:
        model = Challan
        fields = '__all__'
        read_only_fields = ('export_house', 'created_at')

    def get_export_house_name(self, obj):
        if hasattr(obj.export_house, 'export_profile') and obj.export_house.export_profile.company_name:
            return obj.export_house.export_profile.company_name
        return obj.export_house.username

    def get_export_house_address(self, obj):
        if hasattr(obj.export_house, 'export_profile') and obj.export_house.export_profile.corporate_address:
            return obj.export_house.export_profile.corporate_address
        return ""

    def get_export_house_gstin(self, obj):
        if hasattr(obj.export_house, 'export_profile') and obj.export_house.export_profile.gstin:
            return obj.export_house.export_profile.gstin
        return ""

    def get_job_name(self, obj):
        return obj.job.title if obj.job else ""

    def get_export_house_signature(self, obj):
        if hasattr(obj.export_house, 'export_profile') and obj.export_house.export_profile.authorized_signature:
            request = self.context.get('request')
            photo_url = obj.export_house.export_profile.authorized_signature.url
            if request: return request.build_absolute_uri(photo_url)
            return "http://localhost:8000" + photo_url
        return None

    def create(self, validated_data):
        materials_data = validated_data.pop('materials', [])
        challan = Challan.objects.create(**validated_data)
        for mat in materials_data:
            ChallanMaterial.objects.create(challan=challan, **mat)
        return challan

    def update(self, instance, validated_data):
        materials_data = validated_data.pop('materials', None)
        
        # update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if materials_data is not None:
             # Very simple over-write: clear and recreate for draft updates
             instance.materials.all().delete()
             for mat in materials_data:
                 ChallanMaterial.objects.create(challan=instance, **mat)
                 
        return instance
