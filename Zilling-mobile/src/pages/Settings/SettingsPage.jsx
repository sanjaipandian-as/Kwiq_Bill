import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Store,
  Calculator,
  Layout,
  Printer,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  MapPin,
  Mail,
  Phone,
  Building,
  AlertCircle,
  LogOut,
  HelpCircle,
  MessageCircle,
  Send
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import services from '../../services/api';

const SettingsPage = ({ navigation }) => {
  const { logout } = useAuth();
  const { settings, updateSettings, saveFullSettings, syncAllData, forceResync, lastEventSyncTime, loading } = useSettings();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('store');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [taxGroups, setTaxGroups] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (settings?.tax?.taxGroups) {
      setTaxGroups(settings.tax.taxGroups);
    }
  }, [settings]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#ffffff');
      }
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            // Navigation reset is handled by AuthStack usually, but ensures safety
          }
        }
      ]
    );
  };

  // ... (keeping existing save/cancel/change handlers) ...
  const handleSave = async () => {
    const payload = {
      ...settings,
      tax: {
        ...settings.tax,
        taxGroups: taxGroups
      },
      lastUpdatedAt: new Date()
    };
    try {
      await saveFullSettings(payload);
      setUnsavedChanges(false);
      setIsEditing(false);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error("Failed to save settings", error);
      Alert.alert('Error', 'Failed to save settings. Local state updated.');
    }
  };

  const handleCancel = () => {
    if (unsavedChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => {
              setIsEditing(false);
              setUnsavedChanges(false);
              // Reset local state to original settings
              setTaxGroups(settings?.tax?.taxGroups || []);
            }
          },
        ]
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleChange = (section, field, value, subField = null) => {
    if (!isEditing) {
      showToast("Please tap the Edit icon to make changes", "info");
      return;
    }

    setUnsavedChanges(true);
    if (subField) {
      updateSettings(section, {
        [field]: {
          ...settings[section][field],
          [subField]: value
        }
      });
    } else {
      updateSettings(section, { [field]: value });
    }
  };

  const addTaxGroup = () => {
    const newGroup = {
      id: Date.now().toString(),
      name: 'New Tax Group',
      rate: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      active: true
    };
    setTaxGroups([...taxGroups, newGroup]);
    setUnsavedChanges(true);
  };

  const updateTaxGroup = (id, field, value) => {
    const updated = taxGroups.map(g => {
      if (g.id === id) {
        const updatedGroup = { ...g, [field]: value };
        if (field === 'rate') {
          const rate = parseFloat(value) || 0;
          updatedGroup.igst = rate;
          updatedGroup.cgst = rate / 2;
          updatedGroup.sgst = rate / 2;
        }
        return updatedGroup;
      }
      return g;
    });
    setTaxGroups(updated);
    setUnsavedChanges(true);
  };

  const removeTaxGroup = (id) => {
    setTaxGroups(taxGroups.filter(g => g.id !== id));
    setUnsavedChanges(true);
  };

  const tabs = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'tax', label: 'Tax', icon: Calculator },
    { id: 'invoice', label: 'Invoice', icon: Layout },
    { id: 'print', label: 'Print', icon: Printer },
    { id: 'backup', label: 'Backup', icon: Save },
    { id: 'contact', label: 'Contact', icon: HelpCircle },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  if (loading || !settings) {
    return (
      <View style={styles.center}>
        <Text>Loading Settings...</Text>
      </View>
    );
  }

  const DetailRow = ({ label, value, icon: Icon }) => (
    <View style={styles.detailRow}>
      {Icon && <Icon size={18} color="#64748b" style={styles.detailIcon} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'store':
        return (
          <View style={styles.tabContent}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.headerIconContainer, { backgroundColor: '#10b981' }]}>
                  <Building size={20} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>Basic Details</Text>
              </View>
              <View style={styles.cardPadding}>
                {isEditing ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Store Display Name</Text>
                      <Input
                        value={settings.store.name}
                        onChangeText={(v) => handleChange('store', 'name', v)}
                        placeholder="e.g. Kwiq Billing Store"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Legal Business Name</Text>
                      <Input
                        value={settings.store.legalName}
                        onChangeText={(v) => handleChange('store', 'legalName', v)}
                        placeholder="As per GST Certificate"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Contact Number</Text>
                        <Input
                          value={settings.store.contact}
                          onChangeText={(v) => handleChange('store', 'contact', v)}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email Address</Text>
                      <Input
                        value={settings.store.email}
                        onChangeText={(v) => handleChange('store', 'email', v)}
                        keyboardType="email-address"
                      />
                    </View>
                  </>
                ) : (
                  <View>
                    <DetailRow label="Store Display Name" value={settings.store.name} icon={Store} />
                    <DetailRow label="Legal Business Name" value={settings.store.legalName} icon={Building} />
                    <DetailRow label="Contact Number" value={settings.store.contact} icon={Phone} />
                    <DetailRow label="Email Address" value={settings.store.email} icon={Mail} />
                  </View>
                )}
              </View>
            </Card>

            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.headerIconContainer, { backgroundColor: '#000' }]}>
                  <MapPin size={20} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>Location & Address</Text>
              </View>
              <View style={styles.cardPadding}>
                {isEditing ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Street Address</Text>
                      <Input
                        value={settings.store.address?.street}
                        onChangeText={(v) => handleChange('store', 'address', v, 'street')}
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>City</Text>
                        <Input
                          value={settings.store.address?.city}
                          onChangeText={(v) => handleChange('store', 'address', v, 'city')}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Pincode</Text>
                        <Input
                          value={settings.store.address?.pincode}
                          onChangeText={(v) => handleChange('store', 'address', v, 'pincode')}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <View>
                    <DetailRow label="Street Address" value={settings.store.address?.street} icon={MapPin} />
                    <DetailRow label="City" value={settings.store.address?.city} />
                    <DetailRow label="Pincode" value={settings.store.address?.pincode} />
                  </View>
                )}
              </View>
            </Card>
          </View>
        );

      case 'tax':
        return (
          <View style={styles.tabContent}>
            {/* GST Global Toggle Section */}
            <Card style={styles.card}>
              <View style={styles.cardPadding}>
                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.cardTitle}>GST Configuration</Text>
                    <Text style={styles.helperText}>Enable tax calculations & compliance</Text>
                  </View>
                  <Switch
                    value={settings.tax.gstEnabled}
                    onValueChange={(v) => handleChange('tax', 'gstEnabled', v)}
                    trackColor={{ false: '#f1f5f9', true: '#000000' }}
                  />
                </View>

                {settings.tax.gstEnabled && (
                  <>
                    <View style={styles.divider} />

                    {/* GSTIN Input */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>GSTIN Number</Text>
                      {isEditing ? (
                        <Input
                          value={settings.store.gstin}
                          onChangeText={(v) => handleChange('store', 'gstin', v.toUpperCase())}
                          autoCapitalize="characters"
                          placeholder="22AAAAA0000A1Z5"
                        />
                      ) : (
                        <View style={styles.readOnlyBadge}>
                          <Text style={styles.readOnlyBadgeText}>{settings.store.gstin || 'Not set'}</Text>
                        </View>
                      )}
                    </View>

                    {/* Default Preference Toggle */}
                    <View style={[styles.inputGroup, { marginTop: 16 }]}>
                      <Text style={styles.label}>Default Billing Type</Text>
                      <View style={styles.segmentedControl}>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn,
                            (settings.tax.defaultTaxType || 'intra') === 'intra' && styles.segmentBtnActive
                          ]}
                          onPress={() => handleChange('tax', 'defaultTaxType', 'intra')}
                          disabled={!isEditing}
                        >
                          <Text style={[
                            styles.segmentText,
                            (settings.tax.defaultTaxType || 'intra') === 'intra' && styles.segmentTextActive
                          ]}>Intrastate (Local)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn,
                            (settings.tax.defaultTaxType || 'intra') === 'inter' && styles.segmentBtnActive
                          ]}
                          onPress={() => handleChange('tax', 'defaultTaxType', 'inter')}
                          disabled={!isEditing}
                        >
                          <Text style={[
                            styles.segmentText,
                            (settings.tax.defaultTaxType || 'intra') === 'inter' && styles.segmentTextActive
                          ]}>Interstate (Outside)</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.helperTextSmall}>
                        Choose which tax mode is applied by default for new customers.
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </Card>

            {/* Tax Matrix Section */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Tax Slabs Matrix</Text>
                <Text style={styles.sectionSubtitle}>Define tax rates and see calculated components</Text>
              </View>
              {isEditing && (
                <TouchableOpacity onPress={addTaxGroup} style={[styles.addBtn, { backgroundColor: '#10b981' }]}>
                  <Plus size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Add Slab</Text>
                </TouchableOpacity>
              )}
            </View>

            {taxGroups.map((group) => (
              <Card key={group.id} style={[styles.matrixCard, !group.active && styles.matrixDisabled]}>
                {/* Card Header: Name & Rate */}
                <View style={styles.matrixHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.labelSmall}>SLAB NAME</Text>
                    {isEditing ? (
                      <Input
                        style={styles.matrixInputCompact}
                        value={group.name}
                        onChangeText={(v) => updateTaxGroup(group.id, 'name', v)}
                        placeholder="e.g. GST 18%"
                      />
                    ) : (
                      <Text style={styles.matrixName}>{group.name}</Text>
                    )}
                  </View>

                  <View style={{ width: 100, alignItems: 'center' }}>
                    <Text style={styles.labelSmall}>RATE (%)</Text>
                    {isEditing ? (
                      <Input
                        style={styles.matrixRateInput}
                        keyboardType="numeric"
                        value={group.rate.toString()}
                        onChangeText={(v) => updateTaxGroup(group.id, 'rate', v)}
                      />
                    ) : (
                      <Text style={styles.matrixRateDisplay}>{group.rate}%</Text>
                    )}
                  </View>

                  {isEditing && (
                    <TouchableOpacity onPress={() => removeTaxGroup(group.id)} style={styles.deleteBtnIcon}>
                      <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Card Body: Split View */}
                <View style={styles.matrixSplitView}>
                  {/* Intrastate (Local) */}
                  <View style={[styles.matrixSplitCol, { borderRightWidth: 1, borderRightColor: '#f1f5f9' }]}>
                    <Text style={styles.splitHeader}>INTRASTATE</Text>
                    <Text style={styles.splitSub}>Within State</Text>

                    <View style={styles.taxComponentRow}>
                      <View style={styles.taxCompBadge}>
                        <Text style={styles.taxCompLabel}>CGST</Text>
                        <Text style={styles.taxCompVal}>{group.cgst}%</Text>
                      </View>
                      <View style={styles.taxCompBadge}>
                        <Text style={styles.taxCompLabel}>SGST</Text>
                        <Text style={styles.taxCompVal}>{group.sgst}%</Text>
                      </View>
                    </View>
                  </View>

                  {/* Interstate (Remote) */}
                  <View style={styles.matrixSplitCol}>
                    <Text style={styles.splitHeader}>INTERSTATE</Text>
                    <Text style={styles.splitSub}>Outside State</Text>

                    <View style={styles.taxComponentRow}>
                      <View style={[styles.taxCompBadge, { backgroundColor: '#eff6ff' }]}>
                        <Text style={[styles.taxCompLabel, { color: '#1d4ed8' }]}>IGST</Text>
                        <Text style={[styles.taxCompVal, { color: '#1e3a8a' }]}>{group.igst || group.rate}%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
            <View style={{ height: 40 }} />
          </View>
        );

      case 'invoice':
        return (
          <View style={styles.tabContent}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.headerIconContainer, { backgroundColor: '#10b981' }]}>
                  <Layout size={20} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>Template Design</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
                {['Classic', 'Compact', 'Detailed', 'Minimal'].map(tmpl => (
                  <TouchableOpacity
                    key={tmpl}
                    onPress={() => handleChange('invoice', 'template', tmpl)}
                    activeOpacity={0.7}
                  >
                    <InvoiceTemplatePreview
                      variant={tmpl}
                      isActive={settings.invoice.template === tmpl}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card>

            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.headerIconContainer, { backgroundColor: '#000' }]}>
                  <Calculator size={20} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>Visual Toggles</Text>
              </View>
              <View style={styles.cardPadding}>
                {[
                  { key: 'showLogo', label: 'Show Store Logo' },
                  { key: 'showTaxBreakup', label: 'Tax Breakup Table' },
                  { key: 'showHsn', label: 'HSN/SAC Codes' },
                  { key: 'showQrcode', label: 'UPI QR Code' },
                  { key: 'showTerms', label: 'Terms & Conditions' },
                ].map(opt => (
                  <View key={opt.key} style={styles.toggleItem}>
                    <Text style={styles.toggleLabel}>{opt.label}</Text>
                    <Switch
                      value={settings.invoice[opt.key]}
                      onValueChange={(v) => handleChange('invoice', opt.key, v)}
                      trackColor={{ false: '#f1f5f9', true: '#000000' }}
                    />
                  </View>
                ))}
              </View>
            </Card>
          </View>
        );

      case 'print':
        return (
          <View style={styles.tabContent}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.headerIconContainer, { backgroundColor: '#000' }]}>
                  <Printer size={20} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>Printing Setup</Text>
              </View>
              <View style={styles.cardPadding}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Paper Size</Text>
                  <View style={styles.pickerContainer}>
                    {['80mm', '58mm', 'A4', 'A5'].map(size => (
                      <TouchableOpacity
                        key={size}
                        onPress={() => handleChange('invoice', 'paperSize', size)}
                        style={[
                          styles.pickerItem,
                          settings.invoice.paperSize === size && styles.pickerActive,
                          !isEditing && settings.invoice.paperSize !== size && { opacity: 0.5 }
                        ]}
                      >
                        <Text style={[styles.pickerText, settings.invoice.paperSize === size && styles.pickerTextActive]}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Currency Symbol</Text>
                  {isEditing ? (
                    <Input
                      value={settings.defaults.currency}
                      onChangeText={(v) => handleChange('defaults', 'currency', v)}
                    />
                  ) : (
                    <View style={styles.readOnlyBadge}>
                      <Text style={styles.readOnlyBadgeText}>{settings.defaults.currency || '₹'}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          </View>
        );
      case 'backup':
        return (
          <View style={styles.tabContent}>
            {/* Sync Section */}
            <Card style={styles.card}>
              <View style={styles.cardPadding}>
                <View style={[styles.toggleRow, { marginBottom: 16 }]}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.cardTitle}>Manual Sync (Event Sourcing)</Text>
                    <Text style={styles.helperText}>Pull latest events and push pending changes.</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={async () => {
                    showToast("Syncing...", "info");
                    const success = await syncAllData();
                    if (success) {
                      showToast("Sync Completed Successfully", "success");
                    } else {
                      showToast("Sync Failed", "error");
                    }
                  }}
                  style={{
                    backgroundColor: '#000000',
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 10
                  }}
                >
                  <RotateCcw size={18} color="#fff" />
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Sync Now</Text>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                  <CheckCircle2 size={16} color="#059669" />
                  <Text style={styles.infoText}>
                    Last Synced: {lastEventSyncTime ? new Date(lastEventSyncTime).toLocaleString() : 'Never'}
                  </Text>
                </View>

                {/* Force Re-sync Button */}
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "Force Full Re-sync?",
                      "This will clear the local sync history and attempt to re-download all events from Google Drive. Use this if data is missing.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Yes, Re-sync",
                          onPress: async () => {
                            showToast("Resetting Sync State...", "info");
                            const success = await forceResync();
                            if (success) {
                              showToast("Re-sync Started Successfully", "success");
                            } else {
                              showToast("Re-sync Failed", "error");
                            }
                          }
                        }
                      ]
                    );
                  }}
                  style={{
                    backgroundColor: '#ef4444',
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 10
                  }}
                >
                  <RotateCcw size={18} color="#fff" />
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Force Re-sync (Fix Missing Data)</Text>
                </TouchableOpacity>
              </View>
            </Card>

            <Card style={styles.card}>
              <View style={styles.cardPadding}>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.cardTitle}>Real-time Auto Save</Text>
                    <Text style={styles.helperText}>Automatically sync all your data to your phone's folder whenever you add or edit something.</Text>
                  </View>
                  <Switch
                    value={settings.defaults?.autoSave}
                    onValueChange={(v) => handleChange('defaults', 'autoSave', v)}
                    trackColor={{ false: '#f1f5f9', true: '#10b981' }}
                  />
                </View>

                <View style={styles.infoBox}>
                  <Save size={16} color="#10b981" />
                  <Text style={styles.infoText}>
                    When enabled, the app will update the .json files for Customers, Products, Invoices, and Expenses automatically.
                  </Text>
                </View>
              </View>
            </Card>

            {/* Restore Section - Keeping for Legacy Backup Protocol */}

          </View >
        );
      case 'contact':
        return (
          <View style={styles.tabContent}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.headerIconContainer}>
                  <Headset size={20} color="#2563eb" />
                </View>
                <Text style={styles.cardTitle}>Support & Feedback</Text>
              </View>
              <View style={styles.cardPadding}>
                <Text style={styles.contactIntro}>
                  Have questions or need help? Reach out to our team. We're here to support your business growth.
                </Text>

                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => Linking.openURL('mailto:support@zilling.in')}
                >
                  <View style={[styles.contactIconBox, { backgroundColor: '#eff6ff' }]}>
                    <Mail size={20} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactLabel}>Email Us</Text>
                    <Text style={styles.contactValue}>support@zilling.in</Text>
                  </View>
                  <ExternalLink size={16} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => Linking.openURL('https://zilling.in')}
                >
                  <View style={[styles.contactIconBox, { backgroundColor: '#f0fdf4' }]}>
                    <Globe size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactLabel}>Visit Website</Text>
                    <Text style={styles.contactValue}>www.zilling.in</Text>
                  </View>
                  <ExternalLink size={16} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => Linking.openURL('https://wa.me/91XXXXXXXXXX')}
                >
                  <View style={[styles.contactIconBox, { backgroundColor: '#f0fdfa' }]}>
                    <MessageSquare size={20} color="#0d9488" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactLabel}>WhatsApp Support</Text>
                    <Text style={styles.contactValue}>Quick Chat</Text>
                  </View>
                  <ExternalLink size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </Card>

            <Card style={styles.card}>
              <View style={styles.cardPadding}>
                <View style={styles.infoBox}>
                  <AlertCircle size={16} color="#0369a1" />
                  <Text style={[styles.infoText, { color: '#0369a1' }]}>
                    Response time is usually within 24 hours during business days.
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        );
      case 'contact':
        return (
          <View style={styles.tabContent}>
            <View style={{ padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#1e293b' }}>Help & Support</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Get in touch with Kwiq Billing administrators for any assistance.</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('tel:+919159317290')}
              style={[styles.contactCard, { borderColor: '#e0f2fe' }]}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: '#f0f9ff' }]}>
                <Phone size={24} color="#0284c7" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.contactLabel}>Call Us</Text>
                <Text style={styles.contactValue}>+91 91593 17290</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('mailto:support@kwiqbill.com')}
              style={[styles.contactCard, { borderColor: '#f0fdf4' }]}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: '#f0fdf4' }]}>
                <Mail size={24} color="#16a34a" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@kwiqbill.com</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('whatsapp://send?phone=+919159317290&text=Hi Kwiq Billing Support, I need help with...')}
              style={[styles.contactCard, { borderColor: '#f0fdf4', borderLeftWidth: 5, borderLeftColor: '#25D366' }]}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <MessageCircle size={24} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.contactLabel}>WhatsApp Chat</Text>
                <Text style={styles.contactValue}>+91 91593 17290</Text>
              </View>
              <View style={{ backgroundColor: '#25D366', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>ONLINE</Text>
              </View>
            </TouchableOpacity>

            <View style={{ marginTop: 20, padding: 20, backgroundColor: '#f8fafc', borderRadius: 24, alignItems: 'center' }}>
              <HelpCircle size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#475569', textAlign: 'center' }}>Need immediate help?</Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, lineHeight: 20 }}>
                Our support team is available from 9 AM to 7 PM (Mon-Sat). We usually respond within 2 hours.
              </Text>
            </View>
          </View>
        );
      case 'logout':
        return (
          <View style={styles.tabContent}>
            <Card style={styles.card}>
              <View style={styles.cardPadding}>
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                    <LogOut size={32} color="#ef4444" />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8 }}>Sign Out</Text>
                  <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 }}>
                    Are you sure you want to sign out? Your unsaved local data might be lost if not synced.
                  </Text>

                  <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                      backgroundColor: '#ef4444',
                      paddingVertical: 14,
                      paddingHorizontal: 32,
                      borderRadius: 14,
                      width: '100%',
                      alignItems: 'center',
                      elevation: 4,
                      shadowColor: '#ef4444',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Settings</Text>
            {unsavedChanges && (
              <View style={styles.unsavedBadge}>
                <AlertCircle size={10} color="#92400e" />
                <Text style={styles.unsavedText}>Unsaved Changes</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, !unsavedChanges && styles.saveBtnDisabled, { backgroundColor: '#10b981' }]}>
                <Save size={20} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
              <Edit2 size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabItem,
                  active && styles.tabItemActive,
                  active && tab.id === 'logout' && { backgroundColor: '#ef4444', borderColor: '#ef4444' }
                ]}
              >
                <Icon
                  size={18}
                  color={active ? '#fff' : (tab.id === 'logout' ? '#ef4444' : '#000')}
                />
                <Text style={[
                  styles.tabText,
                  active && styles.tabTextActive,
                  !active && tab.id === 'logout' && { color: '#ef4444' }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scroller} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {renderTabContent()}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Version 1.0.0 (Build 2026.1)</Text>
            <Text style={styles.footerText}>
              Last Sync: {settings.lastUpdatedAt ? new Date(settings.lastUpdatedAt).toLocaleString() : 'Never'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
  unsavedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4, borderWeight: 1, borderColor: '#ef4444', borderWidth: 1 },
  unsavedText: { color: '#ef4444', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', gap: 12 },
  backBtn: { padding: 4 },
  saveBtn: { backgroundColor: '#10b981', padding: 12, borderRadius: 12, elevation: 0, shadowOpacity: 0 },
  editBtn: { backgroundColor: '#000', padding: 12, borderRadius: 12, elevation: 0 },
  cancelBtn: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  saveBtnDisabled: { backgroundColor: '#e2e8f0', opacity: 0.5 },

  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tabScroll: { paddingHorizontal: 16, paddingVertical: 14 },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tabItemActive: { backgroundColor: '#000', borderColor: '#000' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  scroller: { flex: 1 },
  tabContent: { padding: 20 },
  card: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fafafa'
  },
  headerIconContainer: { padding: 8, backgroundColor: '#000', borderRadius: 10 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
  cardPadding: { padding: 20 },
  cardPaddingHorizontal: { paddingHorizontal: 20 },

  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  detailIcon: { marginRight: 14 },
  detailLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 16, color: '#000', fontWeight: '700' },

  readOnlyBadge: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  readOnlyBadgeText: { fontSize: 15, color: '#000', fontWeight: '700' },

  inputGroup: { marginBottom: 22 },
  inputRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 10 },
  helperText: { fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: '500' },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mt4: { marginTop: 24 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 18 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#000' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#000', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  matrixCard: {
    marginBottom: 18,
    padding: 18,
    borderLeftWidth: 8,
    borderLeftColor: '#ef4444',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff'
  },
  matrixDisabled: { opacity: 0.6, borderLeftColor: '#cbd5e1' },
  matrixHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  matrixName: { fontSize: 18, fontWeight: '900', color: '#000' },
  matrixInput: { flex: 1, height: 40, borderWidth: 0, paddingHorizontal: 0, fontSize: 18, fontWeight: '900', color: '#000' },
  matrixBody: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  matrixItem: { flex: 1 },
  matrixLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  matrixVal: { fontSize: 17, fontWeight: '800', color: '#000' },
  smallInput: { height: 46, fontSize: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#000' },

  templateScroll: { paddingVertical: 10, paddingHorizontal: 6 },
  templateBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    marginRight: 14,
    backgroundColor: '#fff',
    minWidth: 130,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  templateActive: { borderColor: '#000', backgroundColor: '#f1f5f9' },
  templateText: { fontWeight: '800', color: '#64748b', fontSize: 15 },
  templateTextActive: { color: '#000' },

  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  toggleLabel: { fontSize: 16, color: '#000', fontWeight: '700' },

  pickerContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 8, borderRadius: 16, marginBottom: 20 },
  pickerItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  pickerActive: { backgroundColor: '#000', elevation: 0 },
  pickerText: { fontSize: 14, fontWeight: '800', color: '#64748b' },
  pickerTextActive: { color: '#fff' },

  footer: { padding: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 20 },
  footerText: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', padding: 14, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#10b981' },
  infoText: { flex: 1, fontSize: 13, color: '#065f46', lineHeight: 18, fontWeight: '500' },

  // Contact Styles
  contactIntro: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 24 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 8 },
  contactIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  contactLabel: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 2 },
  contactValue: { fontSize: 16, color: '#1e293b', fontWeight: '700' },

  // Template Preview Styles
  previewCard: {
    width: 150,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative'
  },
  previewActive: {
    borderColor: '#000',
    borderWidth: 3
  },
  previewHeader: { height: 28, backgroundColor: '#f1f5f9', marginBottom: 10, borderRadius: 6, margin: 10 },
  previewLine: { height: 5, backgroundColor: '#e2e8f0', marginBottom: 6, borderRadius: 3, marginHorizontal: 10 },
  previewBlock: { height: 45, backgroundColor: '#f8fafc', margin: 10, borderRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  previewFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, backgroundColor: '#f1f5f9' },
  previewLabel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  previewText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  previewTextActive: { color: '#000' },

  // Specific Template Styles
  classicHeader: { backgroundColor: '#000' },
  compactBlock: { margin: 5, height: 22 },
  minimalBorder: { borderWidth: 0, backgroundColor: '#fbfbfb' },
  detailedBorder: { borderWidth: 1.5, borderColor: '#000' },

  // --- New Tax UI Styles ---
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 6,
    height: 48,
    marginTop: 8
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  segmentTextActive: {
    color: '#000',
    fontWeight: '800'
  },
  helperTextSmall: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500'
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  matrixInputCompact: {
    height: 42,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 10
  },
  matrixRateInput: {
    height: 42,
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 0
  },
  matrixRateDisplay: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1
  },
  deleteBtnIcon: {
    padding: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    marginTop: 18
  },
  matrixSplitView: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    overflow: 'hidden'
  },
  matrixSplitCol: {
    flex: 1,
    padding: 14,
    backgroundColor: '#fafafa'
  },
  splitHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    marginBottom: 2,
    letterSpacing: 0.5
  },
  splitSub: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 12
  },
  taxComponentRow: {
    gap: 8
  },
  taxCompBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  taxCompLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569'
  },
  taxCompVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000'
  }
});

const InvoiceTemplatePreview = ({ variant, isActive }) => {
  const isClassic = variant === 'Classic';
  const isCompact = variant === 'Compact';
  const isDetailed = variant === 'Detailed';
  const isMinimal = variant === 'Minimal';

  return (
    <View style={[styles.previewCard, isActive && styles.previewActive]}>
      {/* Visual Representation */}
      <View style={{ flex: 1, padding: 2, opacity: isActive ? 1 : 0.6 }}>
        {/* Header */}
        <View style={[
          styles.previewHeader,
          isClassic && { backgroundColor: '#000' },
          isMinimal && { backgroundColor: 'transparent', borderWidth: 0 }
        ]} />

        {/* Body Content */}
        <View style={{ flex: 1 }}>
          {/* Lines representing rows */}
          <View style={[styles.previewLine, { width: '65%', backgroundColor: isClassic ? '#000' : '#e2e8f0' }]} />
          <View style={[styles.previewLine, { width: '45%' }]} />

          {/* Table/Grid Area */}
          {isCompact ? (
            <>
              <View style={[styles.previewBlock, styles.compactBlock]} />
              <View style={[styles.previewBlock, styles.compactBlock]} />
              <View style={[styles.previewBlock, styles.compactBlock]} />
            </>
          ) : isDetailed ? (
            <View style={[styles.previewBlock, styles.detailedBorder, { height: 70 }]} />
          ) : (
            <View style={styles.previewBlock} />
          )}

          <View style={[styles.previewLine, { width: '75%', marginTop: 'auto', marginBottom: 35 }]} />
        </View>

        {/* Footer */}
        <View style={[
          styles.previewFooter,
          isMinimal && { backgroundColor: 'transparent', borderTopWidth: 1.5, borderTopColor: '#000' }
        ]} />
      </View>

      {/* Label */}
      <View style={styles.previewLabel}>
        <Text style={[styles.previewText, isActive && styles.previewTextActive]}>{variant}</Text>
        {isActive && <CheckCircle2 size={14} color="#10b981" style={{ marginTop: 4 }} />}
      </View>
    </View>
  );
};

export default SettingsPage;
