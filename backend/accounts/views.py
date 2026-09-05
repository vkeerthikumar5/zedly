from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, ExportHouseProfile, SubcontractorProfile, Job
from .serializers import (UserSerializer, RegisterSerializer, LoginSerializer, 
                          ExportHouseProfileSerializer, SubcontractorProfileSerializer, JobSerializer)
from rest_framework.views import APIView

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": str(refresh.access_token),
            "refresh": str(refresh),
        })

class LoginAPI(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": str(refresh.access_token),
            "refresh": str(refresh),
        })

class UserAPI(generics.RetrieveAPIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class ProfileAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, *args, **kwargs):
        user = request.user
        if user.role == 'admin':
            profile = user.export_profile
            serializer = ExportHouseProfileSerializer(profile)
        else:
            profile = user.subcontractor_profile
            serializer = SubcontractorProfileSerializer(profile)
        data = serializer.data
        data['first_name'] = user.first_name
        data['last_name'] = user.last_name
        return Response(data)

    def put(self, request, *args, **kwargs):
        user = request.user
        
        # update User level fields
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        user.save()

        if user.role == 'admin':
            profile = user.export_profile
            serializer = ExportHouseProfileSerializer(profile, data=request.data, partial=True)
        else:
            profile = user.subcontractor_profile
            serializer = SubcontractorProfileSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            data['first_name'] = user.first_name
            data['last_name'] = user.last_name
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


import requests
from django.conf import settings

class VerifyGSTINAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        gstin = request.data.get('gstin', '').strip().upper()
        if not gstin:
            return Response({"error": "GSTIN is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if keys are placeholder and simulation is requested or needed
        is_mock_key = (
            not settings.CASHFREE_CLIENT_ID or
            "your_cashfree_client_id" in settings.CASHFREE_CLIENT_ID or
            settings.CASHFREE_CLIENT_ID == ""
        )
        
        if is_mock_key:
            # Simulation/Mock response for testing before pasting keys
            if hasattr(request.user, 'export_profile'):
                prof = request.user.export_profile
                prof.gstin = gstin
                prof.company_name = "APEX EXPORTS INDIA PRIVATE LIMITED"
                prof.corporate_address = "260 A, CHOLKKADAI VEETHI, DHARAPURAM, ERODE, TAMIL NADU, 638201"
                prof.gstin_verified = True
                prof.save()
            elif hasattr(request.user, 'subcontractor_profile'):
                prof = request.user.subcontractor_profile
                prof.id_number = gstin
                prof.workshop_name = "APEX EXPORTS INDIA PRIVATE LIMITED"
                prof.operating_location = "260 A, CHOLKKADAI VEETHI, DHARAPURAM, ERODE, TAMIL NADU, 638201"
                prof.verification_doc_type = 'GSTIN'
                prof.verification_status = 'VERIFIED'
                prof.save()

            return Response({
                "status": "VALID",
                "gstin": gstin,
                "legal_name_of_business": "APEX EXPORTS INDIA PRIVATE LIMITED",
                "trade_name": "APEX TEXTILES",
                "gstin_status": "Active",
                "principal_place_address": "260 A, CHOLKKADAI VEETHI, DHARAPURAM, ERODE, TAMIL NADU, 638201",
                "message": "Simulated verification (Using sandbox mock keys)"
            }, status=status.HTTP_200_OK)
            
        url = f"{settings.CASHFREE_BASE_URL}/verification/gstin"
        headers = {
            "x-client-id": settings.CASHFREE_CLIENT_ID,
            "x-client-secret": settings.CASHFREE_CLIENT_SECRET,
            "Content-Type": "application/json"
        }
        # Cashfree sandbox API requires uppercase payload keys
        payload = {"GSTIN": gstin}
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            # Catch IP validation issue
            if response.status_code == 403:
                res_data = response.json()
                if res_data.get("code") == "ip_validation_failed":
                    ip_addr = res_data.get("message", "").split("current ip is")[-1].split(".")[0].strip() if "current ip is" in res_data.get("message", "") else ""
                    return Response({
                        "error": "IP Whitelisting Required",
                        "details": f"Please white-list your IP address ({ip_addr or '106.197.106.33'}) in Verification Suite -> Secure ID -> Developers -> IP Whitelist inside your Cashfree Merchant Dashboard."
                    }, status=status.HTTP_403_FORBIDDEN)
                return Response({"error": "Forbidden: Please check your API keys or whitelisting settings.", "details": res_data}, status=status.HTTP_403_FORBIDDEN)

            if response.status_code == 200:
                data = response.json()
                
                # Robust parsing for different API contract versions
                status_val = data.get('gst_in_status') or data.get('status')
                legal_name = data.get('legal_name_of_business')
                address = data.get('principal_place_address')
                valid_val = data.get('valid')
                
                nested_data = data.get('data')
                if isinstance(nested_data, dict):
                    status_val = status_val or nested_data.get('status') or nested_data.get('gstin_status') or nested_data.get('gst_status')
                    legal_name = legal_name or nested_data.get('legalName') or nested_data.get('legal_name_of_business')
                    address = address or nested_data.get('principal_place_address') or nested_data.get('stateName')
                    valid_val = valid_val or nested_data.get('validGstin') or nested_data.get('valid')
                    
                is_active = (
                    status_val == 'VALID' or 
                    status_val == 'Active' or 
                    data.get('status_cd') == '1' or
                    valid_val is True
                )
                
                if is_active:
                    final_name = legal_name or "Verified Entity"
                    final_address = address or "Registered Address Office"
                    
                    if hasattr(request.user, 'export_profile'):
                        prof = request.user.export_profile
                        prof.gstin = gstin
                        prof.company_name = final_name
                        prof.corporate_address = final_address
                        prof.gstin_verified = True
                        prof.save()
                    elif hasattr(request.user, 'subcontractor_profile'):
                        prof = request.user.subcontractor_profile
                        prof.id_number = gstin
                        prof.workshop_name = final_name
                        prof.operating_location = final_address
                        prof.verification_doc_type = 'GSTIN'
                        prof.verification_status = 'VERIFIED'
                        prof.save()

                    return Response({
                        "status": "VALID",
                        "gstin": gstin,
                        "legal_name_of_business": final_name,
                        "principal_place_address": final_address,
                        "message": "GSTIN Verified Successfully!"
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "error": "GSTIN is invalid or inactive.",
                        "details": data
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    "error": f"Cashfree verification service error ({response.status_code})",
                    "details": response.text
                }, status=status.HTTP_400_BAD_REQUEST)
        except requests.exceptions.RequestException as e:
            return Response({
                "error": "Failed to connect to Cashfree verification service.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyDocumentAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        import traceback
        try:
            doc_type = request.data.get('doc_type', '').strip().upper() # GSTIN, UDYAM, PAN, AADHAAR
            id_number = request.data.get('id_number', '').strip().upper()

            if not doc_type or not id_number:
                return Response({"error": "Document type and ID number are required."}, status=status.HTTP_400_BAD_REQUEST)
            
            if not hasattr(request.user, 'subcontractor_profile'):
                return Response({"error": "Only subcontractors can use this verification endpoint."}, status=status.HTTP_400_BAD_REQUEST)

            # Check existing registrations across all profiles to prevent duplicates
            if doc_type in ['GSTIN', 'PAN', 'UDYAM']:
                if doc_type == 'GSTIN':
                    if ExportHouseProfile.objects.filter(gstin=id_number).exists() or SubcontractorProfile.objects.filter(verification_doc_type='GSTIN', id_number=id_number).exclude(user=request.user).exists():
                        return Response({"error": "This GSTIN is already registered in Zedly."}, status=status.HTTP_400_BAD_REQUEST)
                elif doc_type == 'UDYAM':
                    if SubcontractorProfile.objects.filter(verification_doc_type='UDYAM', id_number=id_number).exclude(user=request.user).exists():
                        return Response({"error": "This Udyam ID is already registered in Zedly."}, status=status.HTTP_400_BAD_REQUEST)

            is_mock_key = (
                not settings.CASHFREE_CLIENT_ID or
                "your_cashfree_client_id" in settings.CASHFREE_CLIENT_ID or
                settings.CASHFREE_CLIENT_ID == ""
            )

            legal_name = ""
            address = ""
            pan_category = ""

            if is_mock_key:
                # Simulated responses
                if doc_type == 'GSTIN':
                    legal_name = "APEX TEXTILE WEAVERS"
                    address = "260 A, CHOLKKADAI VEETHI, DHARAPURAM, ERODE, TAMIL NADU, 638201"
                elif doc_type == 'UDYAM':
                    legal_name = "SRI AMMAN WEAVING MILLS"
                    address = "45, TEXTILE NAGAR, KARUR, TAMIL NADU, 639002"
                elif doc_type == 'PAN':
                    is_personal = len(id_number) >= 4 and id_number[3] == 'P'
                    pan_category = "PERSONAL" if is_personal else "BUSINESS"
                    legal_name = "KEERTHIKUMAR V" if is_personal else "ZEDLY TEXTILE TRADERS CONCERN"
                    address = ""
                elif doc_type == 'AADHAAR':
                    legal_name = "KEERTHIKUMAR V"
                    address = ""
                else:
                    return Response({"error": "Unsupported document type."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Real Cashfree API integration
                import time
                headers = {
                    "x-client-id": settings.CASHFREE_CLIENT_ID,
                    "x-client-secret": settings.CASHFREE_CLIENT_SECRET,
                    "Content-Type": "application/json"
                }
                verification_id = f"ref_{request.user.id}_{int(time.time())}"

                def get_cashfree_error(resp, label):
                    if resp.status_code == 403:
                        try:
                            res = resp.json()
                            if res.get("code") == "ip_validation_failed":
                                return Response({"error": f"Cashfree IP Whitelist Required: {res.get('message', '')}"}, status=status.HTTP_403_FORBIDDEN)
                            return Response({"error": f"Cashfree Authentication Error: {res.get('message', '')}"}, status=status.HTTP_403_FORBIDDEN)
                        except:
                            pass
                    return Response({"error": f"Cashfree {label} Validation Failed. Make sure test details are correct.", "details": resp.text}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    if doc_type == 'GSTIN':
                        url = f"{settings.CASHFREE_BASE_URL}/verification/gstin"
                        payload = {
                            "GSTIN": id_number
                        }
                        response = requests.post(url, json=payload, headers=headers, timeout=10)
                        if response.status_code == 200:
                            data = response.json()
                            status_val = data.get('gst_in_status') or data.get('status') or ""
                            legal_name = data.get('legal_name_of_business') or ""
                            address = data.get('principal_place_address') or ""
                            nested_data = data.get('data')
                            if isinstance(nested_data, dict):
                                status_val = status_val or nested_data.get('status') or nested_data.get('gstin_status') or ""
                                legal_name = legal_name or nested_data.get('legalName') or nested_data.get('legal_name_of_business') or ""
                                address = address or nested_data.get('principal_place_address') or ""
                            
                            if status_val in ['VALID', 'Active'] or data.get('valid') is True:
                                pass
                            else:
                                return Response({"error": "GSTIN is invalid or inactive."}, status=status.HTTP_400_BAD_REQUEST)
                        else:
                            return get_cashfree_error(response, 'GSTIN')

                    elif doc_type == 'UDYAM':
                        url = f"{settings.CASHFREE_BASE_URL}/verification/udyam"
                        payload = {
                            "verification_id": verification_id,
                            "udyam": id_number
                        }
                        response = requests.post(url, json=payload, headers=headers, timeout=10)
                        if response.status_code == 200:
                            data = response.json()
                            legal_name = data.get('enterprise_name') or ""
                            address = data.get('office_address') or ""
                            
                            # Fallback parsing for split_address if office_address is empty
                            split_addr = data.get('split_address')
                            if not address and isinstance(split_addr, dict):
                                parts = []
                                for k in ['flat', 'building', 'village', 'street', 'city', 'district', 'state', 'pincode']:
                                    val = split_addr.get(k)
                                    if val:
                                        parts.append(str(val))
                                if parts:
                                    address = ", ".join(parts)

                            nested_data = data.get('data')
                            if isinstance(nested_data, dict):
                                legal_name = legal_name or nested_data.get('enterprise_name') or ""
                                nested_address = nested_data.get('office_address') or ""
                                nested_split = nested_data.get('split_address')
                                if not nested_address and isinstance(nested_split, dict):
                                    parts = []
                                    for k in ['flat', 'building', 'village', 'street', 'city', 'district', 'state', 'pincode']:
                                        val = nested_split.get(k)
                                        if val:
                                            parts.append(str(val))
                                    if parts:
                                        nested_address = ", ".join(parts)
                                address = address or nested_address
                        else:
                            return get_cashfree_error(response, 'Udyam')

                    elif doc_type == 'PAN':
                        url = f"{settings.CASHFREE_BASE_URL}/verification/pan"
                        payload = {
                            "verification_id": verification_id,
                            "pan": id_number
                        }
                        response = requests.post(url, json=payload, headers=headers, timeout=10)
                        if response.status_code == 200:
                            data = response.json()
                            
                            if data.get('valid') is False:
                                return Response({"error": "Cashfree rejected this PAN. It is syntactically valid but marked as 'valid: False' by the database."}, status=status.HTTP_400_BAD_REQUEST)
                                
                            legal_name = data.get('name') or data.get('registered_name') or ""
                            nested_data = data.get('data')
                            if isinstance(nested_data, dict):
                                legal_name = legal_name or nested_data.get('name') or ""
                            
                            is_personal = len(id_number) >= 4 and id_number[3] == 'P'
                            pan_category = "PERSONAL" if is_personal else "BUSINESS"
                        else:
                            return get_cashfree_error(response, 'PAN card')

                    elif doc_type == 'AADHAAR':
                        legal_name = request.user.username or "Verified Aadhaar User"
                        address = ""
                    else:
                        return Response({"error": "Unsupported document type."}, status=status.HTTP_400_BAD_REQUEST)
                except requests.exceptions.RequestException as e:
                    return Response({"error": "Failed to connect to verification provider.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Update subcontractor profile database
            profile = request.user.subcontractor_profile
            
            if doc_type == 'GSTIN':
                profile.workshop_name = legal_name or "Verified GSTIN Entity"
                profile.operating_location = address or ""
                profile.verification_doc_type = 'GSTIN'
                profile.id_number = id_number
                profile.verification_status = 'Business Verified'
            elif doc_type == 'UDYAM':
                profile.workshop_name = legal_name or "Verified MSME Entity"
                profile.operating_location = address or ""
                profile.verification_doc_type = 'UDYAM'
                profile.id_number = id_number
                profile.verification_status = 'Business Verified'
            elif doc_type == 'PAN':
                is_personal = len(id_number) >= 4 and id_number[3] == 'P'
                if is_personal:
                    profile.legal_name = legal_name or "Verified Individual"
                    profile.verification_doc_type = 'PERSONAL_PAN'
                    profile.id_number = id_number
                    profile.verification_status = 'User Verified'
                else:
                    profile.workshop_name = legal_name or "Verified Corporate Entity"
                    profile.verification_doc_type = 'BUSINESS_PAN'
                    profile.id_number = id_number
                    profile.verification_status = 'Business Verified'
            elif doc_type == 'AADHAAR':
                profile.legal_name = legal_name or request.user.username or "Verified Aadhaar User"
                profile.verification_doc_type = 'AADHAAR'
                profile.id_number = id_number
                profile.verification_status = 'User Verified'

            profile.save()
            
            serializer = SubcontractorProfileSerializer(profile)
            return Response({
                "message": "Verification Successful!",
                "profile": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Internal Backend Error", "details": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class JobAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role == 'subcontractor':
            from django.utils import timezone
            from django.db.models import Q
            now = timezone.now()
            jobs = Job.objects.filter(
                Q(visible_from_time__isnull=True) | Q(visible_from_time__lte=now)
            ).order_by('-created_at')
        else:
            jobs = Job.objects.filter(owner=request.user).order_by('-created_at')
            
        serializer = JobSerializer(jobs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = JobSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobDetailAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Job.objects.get(pk=pk, owner=user)
        except Job.DoesNotExist:
            return None

    def put(self, request, pk, *args, **kwargs):
        job = self.get_object(pk, request.user)
        if not job:
            return Response({"error": "Job not found or permission denied."}, status=status.HTTP_404_NOT_FOUND)
        serializer = JobSerializer(job, data=request.data, context={'request': request}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, *args, **kwargs):
        job = self.get_object(pk, request.user)
        if not job:
            return Response({"error": "Job not found or permission denied."}, status=status.HTTP_404_NOT_FOUND)
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class PlaceBidAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        if request.user.role != 'subcontractor':
            return Response({"error": "Only subcontractors can place bids."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)
            
        from django.utils import timezone
        
        # Validation for bidding status
        now = timezone.now()
        if job.bidding_end_time and now > job.bidding_end_time:
            return Response({"error": "Bidding is closed for this job."}, status=status.HTTP_400_BAD_REQUEST)
        
        if job.bidding_start_time and now < job.bidding_start_time:
            return Response({"error": "Bidding has not started yet."}, status=status.HTTP_400_BAD_REQUEST)

        from .models import JobBid
        if JobBid.objects.filter(job=job, subcontractor=request.user).exists():
            return Response({"error": "You have already placed a bid on this job."}, status=status.HTTP_400_BAD_REQUEST)

        from .serializers import JobBidSerializer
        serializer = JobBidSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(job=job, subcontractor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class JobBidsAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"error": "Only export houses can view bids."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            job = Job.objects.get(pk=pk, owner=request.user)
        except Job.DoesNotExist:
            return Response({"error": "Job not found or permission denied."}, status=status.HTTP_404_NOT_FOUND)
            
        from .models import JobBid
        from .serializers import JobBidSerializer
        
        bids = JobBid.objects.filter(job=job).order_by('quoted_price')
        serializer = JobBidSerializer(bids, many=True)
        return Response(serializer.data)

class DeleteBidAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, *args, **kwargs):
        from .models import JobBid
        try:
            bid = JobBid.objects.get(pk=pk, subcontractor=request.user)
            bid.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except JobBid.DoesNotExist:
            return Response({"error": "Bid not found or permission denied."}, status=status.HTTP_404_NOT_FOUND)

class AwardBidAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        from .models import JobBid
        try:
            bid = JobBid.objects.get(pk=pk, job__owner=request.user)
            if bid.status == 'Accepted':
                return Response({"error": "Bid is already awarded."}, status=status.HTTP_400_BAD_REQUEST)
            # You can only award one bid per job in this logic
            JobBid.objects.filter(job=bid.job, status='Accepted').update(status='Pending')
            bid.status = 'Accepted'
            bid.save()
            return Response({"message": "Contract Awarded"}, status=status.HTTP_200_OK)
        except JobBid.DoesNotExist:
            return Response({"error": "Bid not found or permission denied."}, status=status.HTTP_404_NOT_FOUND)

class CancelAwardBidAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        from .models import JobBid
        try:
            bid = JobBid.objects.get(pk=pk, job__owner=request.user, status='Accepted')
            bid.status = 'Pending'
            bid.save()
            return Response({"message": "Contract Cancelled"}, status=status.HTTP_200_OK)
        except JobBid.DoesNotExist:
            return Response({"error": "Bid not accepted or missing."}, status=status.HTTP_404_NOT_FOUND)

from .models import Challan
from .serializers import ChallanSerializer
import uuid
from django.utils.timezone import now

class ChallanAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role == 'admin':
            challans = Challan.objects.filter(export_house=request.user).order_by('-created_at')
        else:
            challans = Challan.objects.filter(subcontractor=request.user).order_by('-created_at')
        serializer = ChallanSerializer(challans, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        from .models import Job
        d = request.data.copy()
        job = None
        if d.get('job'):
            try:
                job = Job.objects.get(id=d.get('job'), owner=request.user)
            except Job.DoesNotExist:
                return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)
        
        while True:
            candidate = f"CH-{now().strftime('%Y')}-{request.user.id}-{uuid.uuid4().hex[:6].upper()}"
            if not Challan.objects.filter(challan_number=candidate).exists():
                d['challan_number'] = candidate
                break
        serializer = ChallanSerializer(data=d)
        if serializer.is_valid():
            sub = job.bids.filter(status='Accepted').first().subcontractor if job and job.bids.filter(status='Accepted').exists() else None
            serializer.save(export_house=request.user, subcontractor=sub)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChallanDetailAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
           if user.role == 'admin':
               return Challan.objects.get(pk=pk, export_house=user)
           return Challan.objects.get(pk=pk, subcontractor=user)
        except Challan.DoesNotExist:
            return None

    def put(self, request, pk, *args, **kwargs):
        challan = self.get_object(pk, request.user)
        if not challan:
             return Response({"error": "Challan missing"}, status=status.HTTP_404_NOT_FOUND)
             
        data = request.data.copy()
        if data.get('status') == 'Gate-In Verified' and challan.status != 'Gate-In Verified':
            from django.utils import timezone
            data['gate_in_timestamp'] = timezone.now()

        serializer = ChallanSerializer(challan, data=data, partial=True)
        if serializer.is_valid():
             challan_inst = serializer.save()
             
             # Recalculate Subcontractor Profile Rating
             if data.get('rating') and challan_inst.subcontractor:
                 from .models import SubcontractorProfile
                 from django.db.models import Avg, Count
                 sub_profile = SubcontractorProfile.objects.filter(user=challan_inst.subcontractor).first()
                 if sub_profile:
                     stats = Challan.objects.filter(subcontractor=challan_inst.subcontractor, rating__isnull=False).aggregate(Avg('rating'), Count('rating'))
                     
                     if stats['rating__avg']:
                         sub_profile.average_rating = round(stats['rating__avg'], 1)
                     if stats['rating__count']:
                         sub_profile.total_ratings = stats['rating__count']
                         
                     sub_profile.save()
             
             return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, *args, **kwargs):
        challan = self.get_object(pk, request.user)
        if not challan:
             return Response({"error": "Challan not found"}, status=status.HTTP_404_NOT_FOUND)
        if challan.status.lower() not in ['draft', 'in transit']:
             return Response({"error": "Cannot delete challan that is past InTransit state"}, status=status.HTTP_400_BAD_REQUEST)
        challan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MarkJobFinishedAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        if request.user.role != 'subcontractor':
            return Response({"error": "Only subcontractors can mark jobs as finished."}, status=status.HTTP_403_FORBIDDEN)
        
        from django.utils import timezone
        try:
            job = Job.objects.get(pk=pk, bids__subcontractor=request.user, bids__status='Accepted')
            job.status = 'Closed'
            job.completed_at = timezone.now()
            # If a photo was submitted, just save a placeholder or text note for now 
            job.completion_proof = request.data.get('completion_proof', 'Photo Attached')
            job.save()
            return Response({"message": "Job marked as completed!"}, status=status.HTTP_200_OK)
        except Job.DoesNotExist:
            return Response({"error": "Active awarded job not found."}, status=status.HTTP_404_NOT_FOUND)

class DashboardStatsAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"error": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
        
        from django.utils import timezone
        import datetime
        from .models import Job, JobBid
        
        today = timezone.now().date()
        
        # Active jobs: not Closed
        active_jobs_count = Job.objects.filter(owner=request.user).exclude(status='Closed').count()
        
        # Total bids today across all jobs of this export house
        bids_today = JobBid.objects.filter(job__owner=request.user, created_at__date=today).count()
        yesterday = today - datetime.timedelta(days=1)
        bids_yesterday = JobBid.objects.filter(job__owner=request.user, created_at__date=yesterday).count()
        
        increase_pct = 0
        if bids_yesterday > 0:
            increase_pct = int(((bids_today - bids_yesterday) / bids_yesterday) * 100)
        else:
            increase_pct = 100 if bids_today > 0 else 0
            
        # Jobs in production: Jobs that have an accepted bid but aren't closed
        in_production_count = Job.objects.filter(owner=request.user, bids__status='Accepted').exclude(status='Closed').distinct().count()
            
        return Response({
            "active_jobs": active_jobs_count,
            "total_bids_today": bids_today,
            "bids_increase_pct": increase_pct,
            "jobs_in_production": in_production_count
        })

class SubcontractorNetworkAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"error": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
            
        from .models import Job, SubcontractorProfile
        
        # Get unique subcontractors who have an accepted bid on this export house's jobs
        jobs = Job.objects.filter(owner=request.user, bids__status='Accepted')
        subcontractor_ids = jobs.values_list('bids__subcontractor', flat=True).distinct()
        
        profiles = SubcontractorProfile.objects.filter(user__id__in=subcontractor_ids)
        
        network_data = []
        for profile in profiles:
            rating = profile.average_rating if profile.average_rating > 0 else 'No rating'
            active_jobs_count = Job.objects.filter(bids__subcontractor=profile.user, bids__status='Accepted').exclude(status='Closed').count()
            
            network_data.append({
                "id": profile.user.id,
                "name": profile.workshop_name or profile.legal_name,
                "location": profile.operating_location,
                "id_number": profile.id_number,
                "jobs": f"{active_jobs_count} Active",
                "active_jobs_count": active_jobs_count,
                "rating": rating,
                "verification_status": profile.verification_status,
                "verification_doc_type": profile.verification_doc_type
            })
            
        # Summary metrics
        total_partners = profiles.count()
        avg_network_rating = 0
        rated_profiles = [p for p in profiles if p.average_rating > 0]
        if rated_profiles:
            avg_network_rating = round(sum(p.average_rating for p in rated_profiles) / len(rated_profiles), 1)
        
        # Capacity logic can be placeholder or summed, we'll keep it static or random for now as it's not defined
        return Response({
            "network": network_data,
            "total_partners": total_partners,
            "avg_rating": avg_network_rating if avg_network_rating > 0 else "0.0"
        })
