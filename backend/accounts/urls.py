from django.urls import path
from .views import (RegisterAPI, LoginAPI, UserAPI, ProfileAPI, VerifyGSTINAPI, 
                    VerifyDocumentAPI, JobAPI, JobDetailAPI, PlaceBidAPI, JobBidsAPI,
                    DeleteBidAPI, AwardBidAPI, CancelAwardBidAPI, ChallanAPI, ChallanDetailAPI)
from .views import MarkJobFinishedAPI, DashboardStatsAPI, SubcontractorNetworkAPI

urlpatterns = [
    path('network/', SubcontractorNetworkAPI.as_view(), name='network'),
    path('dashboard-stats/', DashboardStatsAPI.as_view(), name='dashboard-stats'),
    path('auth/register/', RegisterAPI.as_view(), name='register'),
    path('auth/login/', LoginAPI.as_view(), name='login'),
    path('auth/user/', UserAPI.as_view(), name='user'),
    path('profile/', ProfileAPI.as_view(), name='profile'),
    path('profile/verify-gstin/', VerifyGSTINAPI.as_view(), name='verify-gstin'),
    path('profile/verify-document/', VerifyDocumentAPI.as_view(), name='verify-document'),
    path('jobs/', JobAPI.as_view(), name='jobs'),
    path('jobs/<int:pk>/', JobDetailAPI.as_view(), name='job-detail'),
    path('jobs/<int:pk>/bid/', PlaceBidAPI.as_view(), name='place-bid'),
    path('jobs/<int:pk>/bids/', JobBidsAPI.as_view(), name='job-bids'),
    
    path('bids/<int:pk>/delete/', DeleteBidAPI.as_view(), name='delete-bid'),
    path('bids/<int:pk>/award/', AwardBidAPI.as_view(), name='award-bid'),
    path('bids/<int:pk>/cancel/', CancelAwardBidAPI.as_view(), name='cancel-award-bid'),
    
    path('challans/', ChallanAPI.as_view(), name='challans'),
    path('challans/<int:pk>/', ChallanDetailAPI.as_view(), name='challan-detail'),
    path('jobs/<int:pk>/finish/', MarkJobFinishedAPI.as_view(), name='mark-job-finished'),
]
