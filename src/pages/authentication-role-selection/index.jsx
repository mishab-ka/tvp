import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import LoginForm from './components/LoginForm';
import MFAVerification from './components/MFAVerification';
import RoleSelection from './components/RoleSelection';
import SystemStatus from './components/SystemStatus';
import SecurityNotice from './components/SecurityNotice';
import Icon from '../../components/AppIcon';

const AuthenticationRoleSelection = () => {
  const [currentStep, setCurrentStep] = useState('login'); // login, mfa, role
  const [userData, setUserData] = useState(null);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [showSystemStatus, setShowSystemStatus] = useState(false);

  useEffect(() => {
    // Check for existing session
    const existingSession = localStorage.getItem('tawaaq_session');
    if (existingSession) {
      try {
        const session = JSON.parse(existingSession);
        if (new Date(session.expiresAt) > new Date()) {
          // Valid session exists, redirect to appropriate dashboard
          window.location.href = session?.role === 'admin' ? '/tvp-owners-management' : '/executive-dashboard';
        } else {
          localStorage.removeItem('tawaaq_session');
        }
      } catch (error) {
        localStorage.removeItem('tawaaq_session');
      }
    }

    // Set up session timeout warning
    const timeout = setTimeout(() => {
      setSessionTimeout(true);
    }, 1800000); // 30 minutes

    return () => clearTimeout(timeout);
  }, []);

  const handleLoginSuccess = (user) => {
    setUserData(user);
    if (user?.mfaEnabled) {
      setCurrentStep('mfa');
    } else {
      setCurrentStep('role');
    }
  };

  const handleMFARequired = (user) => {
    setUserData(user);
    setCurrentStep('mfa');
  };

  const handleMFASuccess = (user) => {
    setUserData(user);
    setCurrentStep('role');
  };

  const handleRoleSelected = (roleData) => {
    // Store session data
    const sessionData = {
      ...roleData,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)?.toISOString() // 8 hours
    };
    
    localStorage.setItem('tawaaq_session', JSON.stringify(sessionData));
    
    // Session is handled by RoleSelection component navigation
  };

  const handleBackToLogin = () => {
    setCurrentStep('login');
    setUserData(null);
  };

  const getCurrentYear = () => {
    return new Date()?.getFullYear();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'mfa':
        return (
          <MFAVerification
            userData={userData}
            onVerificationSuccess={handleMFASuccess}
            onBack={handleBackToLogin}
          />
        );
      case 'role':
        return (
          <RoleSelection
            userData={userData}
            onRoleSelected={handleRoleSelected}
          />
        );
      default:
        return (
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onMFARequired={handleMFARequired}
          />
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Authentication & Role Selection - Tawaaq Admin Portal</title>
        <meta name="description" content="Secure login portal for Tawaaq fleet management system with multi-factor authentication and role-based access control." />
      </Helmet>

      <div className="min-h-screen bg-background flex">
        {/* Left Panel - Authentication Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-primary-foreground"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-foreground">Tawaaq</h1>
                  <p className="text-sm text-muted-foreground">Admin Portal</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {currentStep === 'login' && 'Welcome Back'}
                  {currentStep === 'mfa' && 'Verify Your Identity'}
                  {currentStep === 'role' && 'Choose Your Role'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentStep === 'login' && 'Sign in to access your fleet management dashboard'}
                  {currentStep === 'mfa' && 'Complete two-factor authentication to continue'}
                  {currentStep === 'role' && 'Select the role for your current session'}
                </p>
              </div>
            </div>

            {/* Authentication Steps */}
            <div className="bg-card border border-border rounded-lg p-6 card-shadow">
              {renderCurrentStep()}
            </div>

            {/* Session Timeout Warning */}
            {sessionTimeout && (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon name="Clock" size={20} className="text-warning" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Session Timeout Warning</p>
                    <p className="text-xs text-muted-foreground">
                      Your session will expire soon. Please complete authentication to continue.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - System Information */}
        <div className="hidden lg:flex lg:w-96 bg-muted/30 border-l border-border">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">System Information</h3>
                <button
                  onClick={() => setShowSystemStatus(!showSystemStatus)}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <Icon 
                    name={showSystemStatus ? "ChevronUp" : "ChevronDown"} 
                    size={16} 
                    className="text-muted-foreground" 
                  />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {showSystemStatus ? <SystemStatus /> : <SecurityNotice />}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  © {getCurrentYear()} Tawaaq Fleet Management
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                  <a href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                  <span>•</span>
                  <a href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="Shield" size={12} className="text-success" />
                  <span className="text-xs text-success">Secure Connection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthenticationRoleSelection;