import React, { createContext, useContext, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { dataStore } from '../services/dataStore';
import { attendanceService } from '../services/attendanceService';
import { payrollService } from '../services/payrollService';
import { deliveryService } from '../services/deliveryService';
import { firebaseAuthService, RegisterData, AuthResult } from '../services/firebaseAuthService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isDemo: boolean;
  login: (role: UserRole, email?: string, password?: string, isDemoLogin?: boolean) => Promise<boolean>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('receptionist');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  const login = async (
    selectedRole: UserRole,
    email?: string,
    password?: string,
    isDemoLogin?: boolean
  ): Promise<boolean> => {
    const demo = !!isDemoLogin;
    setIsDemo(demo);
    dataStore.setDemoMode(demo);
    attendanceService.setDemoMode(demo);
    payrollService.setDemoMode(demo);
    deliveryService.setDemoMode(demo);

    const authenticatedUser = dataStore.authenticate(selectedRole, email);
    setUser(authenticatedUser);
    setRole(authenticatedUser.role || selectedRole);
    setIsAuthenticated(true);
    return true;
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    const result = await firebaseAuthService.registerUser(data);
    if (result.success && result.user) {
      setIsDemo(false);
      dataStore.setDemoMode(false);
      attendanceService.setDemoMode(false);
      payrollService.setDemoMode(false);
      deliveryService.setDemoMode(false);

      setUser(result.user);
      setRole(result.user.role);
      setIsAuthenticated(true);
    }
    return result;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsDemo(false);
    dataStore.setDemoMode(false);
    attendanceService.setDemoMode(false);
    payrollService.setDemoMode(false);
    deliveryService.setDemoMode(false);
    firebaseAuthService.signOut();
  };

  const switchRole = (newRole: UserRole) => {
    // Quick Demo Role Switcher activates demo data
    setIsDemo(true);
    dataStore.setDemoMode(true);
    attendanceService.setDemoMode(true);
    payrollService.setDemoMode(true);
    deliveryService.setDemoMode(true);

    const nextUser = dataStore.authenticate(newRole);
    setUser(nextUser);
    setRole(newRole);
    setIsAuthenticated(true);
  };

  const updateProfile = (updatedFields: Partial<UserProfile>) => {
    if (user) {
      const mergedUser: UserProfile = {
        ...user,
        ...updatedFields,
        doctorProfile: updatedFields.doctorProfile
          ? { ...(user.doctorProfile || ({} as any)), ...updatedFields.doctorProfile }
          : user.doctorProfile,
        patientProfile: updatedFields.patientProfile
          ? { ...(user.patientProfile || ({} as any)), ...updatedFields.patientProfile }
          : user.patientProfile,
        receptionistProfile: updatedFields.receptionistProfile
          ? { ...(user.receptionistProfile || ({} as any)), ...updatedFields.receptionistProfile }
          : user.receptionistProfile,
        ownerProfile: updatedFields.ownerProfile
          ? { ...(user.ownerProfile || ({} as any)), ...updatedFields.ownerProfile }
          : user.ownerProfile,
      };
      dataStore.updateUser(user.id, mergedUser);
      setUser(mergedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isDemo,
        login,
        register,
        logout,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
