import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Checkbox } from "../components/ui/Checkbox";
import Icon from "../components/AppIcon";
import { userManagementAPI } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [authMethod, setAuthMethod] = useState("email"); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    rememberDevice: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/executive-dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (lockoutTime) {
      const timer = setTimeout(() => {
        setLockoutTime(null);
        setLoginAttempts(0);
      }, lockoutTime * 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password?.length >= 8) strength += 25;
    if (/[A-Z]/?.test(password)) strength += 25;
    if (/[0-9]/?.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/?.test(password)) strength += 25;
    return strength;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    const inputValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear specific error when user starts typing
    if (errors?.[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAuthMethodChange = (method) => {
    setAuthMethod(method);
    setFormData((prev) => ({
      ...prev,
      email: "",
      phone: "",
    }));
    setErrors({});
  };

  const formatPhoneNumber = (phone) => {
    // Simple phone formatting for Saudi numbers
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("966")) {
      return "+" + cleaned;
    } else if (cleaned.startsWith("0")) {
      return "+966" + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return "+966" + cleaned;
    }
    return phone;
  };

  const validateForm = () => {
    const newErrors = {};

    if (authMethod === "email") {
      if (!formData?.email) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData?.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    } else {
      if (!formData?.phone) {
        newErrors.phone = "Phone number is required";
      } else {
        const cleaned = formData?.phone.replace(/\D/g, "");
        if (
          !(
            cleaned.length === 9 ||
            (cleaned.startsWith("966") && cleaned.length === 12)
          )
        ) {
          newErrors.phone = "Please enter a valid Saudi phone number";
        }
      }
    }

    if (!formData?.password) {
      newErrors.password = "Password is required";
    } else if (formData?.password?.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (lockoutTime) {
      setErrors({
        general: `Account locked. Try again in ${lockoutTime} seconds.`,
      });
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Use real database authentication
      const user = await userManagementAPI.authenticateUser(
        authMethod === "email"
          ? formData?.email
          : formatPhoneNumber(formData?.phone),
        formData?.password,
        authMethod
      );

      if (!user) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= 3) {
          setLockoutTime(30);
          setErrors({
            general: "Too many failed attempts. Account locked for 30 seconds.",
          });
        } else {
          setErrors({
            general: `Invalid credentials. ${
              3 - newAttempts
            } attempts remaining.`,
          });
        }
        return;
      }

      // Successful authentication
      const userData = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        department: user.department,
        permissions: user.permissions,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        ssoEnabled: user.ssoEnabled,
        mfaEnabled: user.mfaEnabled,
        rememberDevice: formData?.rememberDevice,
      };

      // Use AuthContext login function
      const loginSuccess = login(userData);

      if (loginSuccess) {
        // Redirect to the page they were trying to access, or default dashboard
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        setErrors({ general: "Login failed. Please try again." });
      }
    } catch (error) {
      setErrors({ general: "Login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "bg-error";
    if (passwordStrength < 50) return "bg-warning";
    if (passwordStrength < 75) return "bg-accent";
    return "bg-success";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Weak";
    if (passwordStrength < 50) return "Fair";
    if (passwordStrength < 75) return "Good";
    return "Strong";
  };

  const getCurrentYear = () => {
    return new Date()?.getFullYear();
  };

  return (
    <>
      <Helmet>
        <title>Login - Tawaaq Admin Portal</title>
        <meta
          name="description"
          content="Secure login portal for Tawaaq fleet management system with multi-factor authentication and role-based access control."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex">
        {/* Left Panel - Login Form */}
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
                  Welcome Back
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to access your fleet management dashboard
                </p>
              </div>
            </div>

            {/* Login Form */}
            <div className="bg-card border border-border rounded-lg p-6 card-shadow">
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors?.general && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Icon
                        name="AlertCircle"
                        size={16}
                        className="text-error"
                      />
                      <p className="text-sm text-error">{errors?.general}</p>
                    </div>
                  </div>
                )}

                {/* Authentication Method Toggle */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Sign in with
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAuthMethodChange("email")}
                      className={`p-3 rounded-lg border transition-all duration-200 flex items-center justify-center space-x-2 ${
                        authMethod === "email"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                      disabled={isLoading || lockoutTime}
                    >
                      <Icon name="Mail" size={16} />
                      <span className="text-sm font-medium">Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAuthMethodChange("phone")}
                      className={`p-3 rounded-lg border transition-all duration-200 flex items-center justify-center space-x-2 ${
                        authMethod === "phone"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                      disabled={isLoading || lockoutTime}
                    >
                      <Icon name="Phone" size={16} />
                      <span className="text-sm font-medium">Phone</span>
                    </button>
                  </div>
                </div>

                {/* Email Input */}
                {authMethod === "email" && (
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData?.email}
                    onChange={handleInputChange}
                    placeholder="Enter your corporate email"
                    error={errors?.email}
                    required
                    disabled={isLoading || lockoutTime}
                  />
                )}

                {/* Phone Input */}
                {authMethod === "phone" && (
                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={formData?.phone}
                    onChange={handleInputChange}
                    placeholder="+966 50 123 4567"
                    error={errors?.phone}
                    required
                    disabled={isLoading || lockoutTime}
                  />
                )}

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData?.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      error={errors?.password}
                      required
                      disabled={isLoading || lockoutTime}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading || lockoutTime}
                    >
                      <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                    </button>
                  </div>

                  {formData?.password && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Password Strength
                        </span>
                        <span
                          className={`font-medium ${
                            passwordStrength < 50
                              ? "text-error"
                              : "text-success"
                          }`}
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Checkbox
                    label="Remember this device"
                    name="rememberDevice"
                    checked={formData?.rememberDevice}
                    onChange={handleInputChange}
                    disabled={isLoading || lockoutTime}
                    size="sm"
                  />

                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                    onClick={() => navigate("/forgot-password")}
                    disabled={isLoading || lockoutTime}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={lockoutTime}
                  iconName="LogIn"
                  iconPosition="right"
                >
                  {lockoutTime ? `Locked (${lockoutTime}s)` : "Sign In"}
                </Button>

                {/* Super Admin credentials display */}
                <div className="mt-6 p-4 bg-muted/50 rounded-md border border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Super Admin Credentials:
                  </h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-1">
                        System Super Administrator:
                      </p>
                      <p>
                        <strong>Email:</strong> sadmin@tawaaq.com
                      </p>
                      <p>
                        <strong>Password:</strong> t4w44q009@@##
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        This super admin can create and manage all other users
                        with different access levels.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Panel - System Information */}
        <div className="hidden lg:flex lg:w-96 bg-muted/30 border-l border-border">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-foreground">
                System Information
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Icon name="Shield" size={20} className="text-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Secure Authentication
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Multi-factor authentication and role-based access
                        control
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Icon
                      name="Smartphone"
                      size={20}
                      className="text-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Mobile Ready
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Access your dashboard from any device
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Icon name="Activity" size={20} className="text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Real-time Updates
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Live fleet monitoring and analytics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  © {getCurrentYear()} Tawaaq Fleet Management
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                  <a
                    href="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <span>•</span>
                  <a
                    href="/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </a>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="Shield" size={12} className="text-success" />
                  <span className="text-xs text-success">
                    Secure Connection
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
