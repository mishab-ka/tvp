import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import Icon from "../../../components/AppIcon";
import { userManagementAPI } from "../../../lib/supabase";

const LoginForm = ({ onLoginSuccess, onMFARequired }) => {
  const navigate = useNavigate();
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

  // Real authentication will be handled by the database
  // No mock credentials needed

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
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Add country code if not present
    if (cleaned.startsWith("966")) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith("0")) {
      return `+966${cleaned.substring(1)}`;
    } else if (cleaned.length === 9) {
      return `+966${cleaned}`;
    }

    return phone;
  };

  const validateForm = () => {
    const newErrors = {};

    if (authMethod === "email") {
      if (!formData?.email) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    } else {
      if (!formData?.phone) {
        newErrors.phone = "Phone number is required";
      } else if (!/^\+966\d{9}$/.test(formatPhoneNumber(formData?.phone))) {
        newErrors.phone =
          "Please enter a valid Saudi phone number (+966XXXXXXXXX)";
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

      if (user?.mfaEnabled) {
        onMFARequired(userData);
      } else {
        onLoginSuccess(userData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors?.general && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-md">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
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
              <span className="text-muted-foreground">Password Strength</span>
              <span
                className={`font-medium ${
                  passwordStrength < 50 ? "text-error" : "text-success"
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
              This super admin can create and manage all other users with
              different access levels.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;

