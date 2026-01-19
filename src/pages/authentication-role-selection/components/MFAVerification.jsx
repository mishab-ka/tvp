import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const MFAVerification = ({ userData, onVerificationSuccess, onBack }) => {
  const [mfaCode, setMfaCode] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Mock MFA code for demo
  const mockMFACode = '123456';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setErrors({ general: 'MFA code expired. Please request a new one.' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    const value = e?.target?.value?.replace(/\D/g, '')?.slice(0, 6);
    setMfaCode(value);
    
    if (errors?.mfaCode) {
      setErrors(prev => ({
        ...prev,
        mfaCode: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!mfaCode) {
      setErrors({ mfaCode: 'MFA code is required' });
      return;
    }

    if (mfaCode?.length !== 6) {
      setErrors({ mfaCode: 'MFA code must be 6 digits' });
      return;
    }

    if (timeLeft <= 0) {
      setErrors({ general: 'MFA code expired. Please request a new one.' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (mfaCode !== mockMFACode) {
        setErrors({ mfaCode: 'Invalid MFA code. Please try again.' });
        return;
      }

      // Successful MFA verification
      onVerificationSuccess(userData);

    } catch (error) {
      setErrors({ general: 'Verification failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendCooldown(60);
    setTimeLeft(300);
    setErrors({});
    
    // Simulate sending new code
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show success message
    setErrors({ 
      general: 'New MFA code sent to your registered device.',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Icon name="Shield" size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app or SMS
        </p>
      </div>
      {errors?.general && (
        <div className={`p-3 rounded-md border ${
          errors?.type === 'success' ?'bg-success/10 border-success/20' :'bg-error/10 border-error/20'
        }`}>
          <div className="flex items-center space-x-2">
            <Icon 
              name={errors?.type === 'success' ? "CheckCircle" : "AlertCircle"} 
              size={16} 
              className={errors?.type === 'success' ? 'text-success' : 'text-error'} 
            />
            <p className={`text-sm ${
              errors?.type === 'success' ? 'text-success' : 'text-error'
            }`}>
              {errors?.general}
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Input
            label="Authentication Code"
            type="text"
            value={mfaCode}
            onChange={handleInputChange}
            placeholder="000000"
            error={errors?.mfaCode}
            required
            disabled={isLoading || timeLeft <= 0}
            className="text-center text-2xl font-mono tracking-widest"
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Code expires in: {formatTime(timeLeft)}</span>
            <span>Demo code: 123456</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            variant="default"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={timeLeft <= 0}
            iconName="Shield"
            iconPosition="right"
          >
            Verify Code
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendCode}
              disabled={!canResend || isLoading}
              iconName="RefreshCw"
              iconPosition="left"
              className="flex-1"
            >
              {canResend ? 'Resend Code' : `Resend (${resendCooldown}s)`}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={isLoading}
              iconName="ArrowLeft"
              iconPosition="left"
              className="flex-1"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </form>
      <div className="p-4 bg-muted/50 rounded-md border border-border">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={16} className="text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Security Notice</p>
            <p className="text-xs text-muted-foreground">
              Your session will be logged and monitored for security purposes. 
              If you're having trouble accessing your account, contact IT support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;