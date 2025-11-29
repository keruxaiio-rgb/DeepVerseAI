"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type SidebarMode = 'nav' | 'payment';
type PaymentOption = 'gcash' | 'bank' | null;

interface SidebarContextType {
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  paymentOption: PaymentOption;
  setPaymentOption: (option: PaymentOption) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('nav');
  const [paymentOption, setPaymentOption] = useState<PaymentOption>(null);

  return (
    <SidebarContext.Provider value={{
      sidebarMode,
      setSidebarMode,
      paymentOption,
      setPaymentOption,
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
