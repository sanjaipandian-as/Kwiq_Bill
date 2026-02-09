import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  BarChart3,
  ArrowDownRight,
  ScanBarcode,
  Settings as SettingsIcon,   // 👈 rename icon
} from 'lucide-react-native';

import Dashboard from '../pages/Dashboard';
import Billing from '../pages/Billing/BillingPage';
import Products from '../pages/Products/ProductListScreen';
import Customers from '../pages/customers/CustomerPage';
import Invoices from '../pages/Invoices/InvoicesPage';
import Reports from '../pages/Reports/ReportsPage';
import Expenses from '../pages/Expenses/ExpensesPage';
import Barcode from '../pages/Barcode/BarcodePage';
import Settings from '../pages/Settings/SettingsPage'; // 👈 page stays Settings

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb', // primary blue
        
      }}
    >
      <Tab.Screen
        name="Billing"
        component={Billing}
        options={{
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Products"
        component={Products}
        options={{
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
        <Tab.Screen
          name="Dashboard"
          component={Dashboard}
          options={{
            tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
          }}
        />
      <Tab.Screen
        name="Customers"
        component={Customers}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

