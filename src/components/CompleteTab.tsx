import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import SignatureCanvas from 'react-signature-canvas';

interface ChecklistItem {
  id: string;
  name: string;
  completed: boolean;
  completedBy: string;
  completedAt: Date;
}

interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
}

interface CompleteTabProps {
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export default function CompleteTab({
  customerName = "SM Seaside City Cebu",
  customerAddress = "South Road Properties, Cebu City, Cebu, Philippines",
  customerPhone = "(032) 888-8888",
  customerEmail = "contact@smseaside.com"
}: CompleteTabProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureDate, setSignatureDate] = useState<Date | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const signatureRef = useRef<any>(null);
  const isWeb = Platform.OS === 'web';

  // Mock checklist items
  const [checklistItems] = useState<ChecklistItem[]>([
    {
      id: '1',
      name: 'Inspect air conditioning unit',
      completed: true,
      completedBy: 'John Doe',
      completedAt: new Date(),
    },
    {
      id: '2',
      name: 'Clean air filters',
      completed: true,
      completedBy: 'John Doe',
      completedAt: new Date(),
    },
    {
      id: '3',
      name: 'Test cooling system',
      completed: true,
      completedBy: 'Alice Smith',
      completedAt: new Date(),
    },
  ]);

  // Mock equipment data
  const [equipments] = useState<Equipment[]>([
    {
      id: '1',
      name: 'Air Conditioning Unit',
      model: 'CS-T43KB4H52',
      serialNumber: '2408304977',
    },
  ]);

  const handleSignatureOK = (signatureData: string) => {
    setSignature(signatureData);
    setSignatureDate(new Date());
    setShowSignaturePad(false);
  };

  const handleSignatureClear = () => {
    if (isWeb) {
      signatureRef.current?.clear();
    } else {
      signatureRef.current?.clearSignature();
    }
  };

  const handleSaveSignature = () => {
    if (isWeb && signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL();
      if (signatureData) {
        setSignature(signatureData);
        setSignatureDate(new Date());
        setShowSignaturePad(false);
      }
    }
  };

  const handleRetakeSignature = () => {
    setSignature(null);
    setSignatureDate(null);
    setShowSignaturePad(true);
  };

  const handleCompleteJob = () => {
    // TODO: Implement job completion logic
    console.log('Job completed');
  };

  const style = `.m-signature-pad {
    box-shadow: none;
    border: none;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body,html {
    width: 100%;
    height: 100%;
  }`;

  return (
    <View>
      {/* Customer Details Section */}
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="person-circle-outline" size={24} color="#0092ce" />
          <Text className="text-lg font-semibold text-slate-800 ml-2">Customer Details</Text>
        </View>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <View className="mb-3">
            <Text className="text-xs text-slate-500 mb-1">Customer Name</Text>
            <Text className="text-base text-slate-800">{customerName}</Text>
          </View>
          <View className="mb-3">
            <Text className="text-xs text-slate-500 mb-1">Address</Text>
            <Text className="text-base text-slate-800">{customerAddress}</Text>
          </View>
          <View className="mb-3">
            <Text className="text-xs text-slate-500 mb-1">Phone</Text>
            <Text className="text-base text-slate-800">{customerPhone}</Text>
          </View>
          <View>
            <Text className="text-xs text-slate-500 mb-1">Email</Text>
            <Text className="text-base text-slate-800">{customerEmail}</Text>
          </View>
        </View>
      </View>

      {/* Service Checklist Section */}
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="checkmark-done-outline" size={24} color="#0092ce" />
          <Text className="text-lg font-semibold text-slate-800 ml-2">Service Checklist</Text>
        </View>
        {checklistItems.map((item) => (
          <View key={item.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-start">
              <View className="mr-3 mt-0.5">
                <Ionicons
                  name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.completed ? '#22c55e' : '#94a3b8'}
                />
              </View>
              <View className="flex-1">
                <Text className="text-base text-slate-800 mb-1">{item.name}</Text>
                <Text className="text-xs text-slate-500">
                  Completed by {item.completedBy} at {item.completedAt.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Equipments Section */}
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="construct-outline" size={24} color="#0092ce" />
          <Text className="text-lg font-semibold text-slate-800 ml-2">Equipments</Text>
        </View>
        {equipments.map((equipment) => (
          <View key={equipment.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-start">
              <View className="mr-3">
                <Ionicons name="hardware-chip-outline" size={24} color="#0092ce" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-800 mb-1">
                  {equipment.name}
                </Text>
                <Text className="text-sm text-slate-600 mb-1">Model: {equipment.model}</Text>
                <Text className="text-sm text-slate-600">S/N: {equipment.serialNumber}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Customer Signature Section */}
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="create-outline" size={24} color="#0092ce" />
          <Text className="text-lg font-semibold text-slate-800 ml-2">Customer Signature</Text>
        </View>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          {!signature || showSignaturePad ? (
            <View>
              {/* Signature Canvas */}
              <View className="border-2 border-slate-300 rounded-xl overflow-hidden mb-4" style={{ height: 250 }}>
                {isWeb ? (
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'signature-canvas',
                      style: { width: '100%', height: '100%' }
                    }}
                  />
                ) : (
                  <SignatureScreen
                    ref={signatureRef}
                    onOK={handleSignatureOK}
                    onClear={handleSignatureClear}
                    webStyle={style}
                    descriptionText="Sign above"
                  />
                )}
              </View>
              {/* Action Buttons */}
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={handleSignatureClear}
                  className="flex-1 bg-slate-200 rounded-lg py-2 px-4 flex-row items-center justify-center mr-2"
                >
                  <Ionicons name="trash-outline" size={18} color="#475569" />
                  <Text className="text-slate-700 font-medium ml-2">Clear</Text>
                </TouchableOpacity>
                {isWeb && (
                  <TouchableOpacity
                    onPress={handleSaveSignature}
                    className="flex-1 bg-[#0092ce] rounded-lg py-2 px-4 flex-row items-center justify-center"
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text className="text-white font-medium ml-2">Save</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View>
              {/* Display Captured Signature */}
              <View className="border-2 border-slate-300 rounded-xl overflow-hidden mb-4" style={{ height: 200 }}>
                <Image
                  source={{ uri: signature }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>

              {/* Signature Date */}
              {signatureDate && (
                <View className="flex-row items-center mb-3">
                  <Ionicons name="time-outline" size={16} color="#64748b" />
                  <Text className="text-sm text-slate-600 ml-2">
                    Signed on {signatureDate.toLocaleString()}
                  </Text>
                </View>
              )}

              {/* Retake Signature Button */}
              <TouchableOpacity
                onPress={handleRetakeSignature}
                className="bg-slate-200 rounded-lg py-2 px-4 flex-row items-center justify-center"
              >
                <Ionicons name="refresh" size={18} color="#475569" />
                <Text className="text-slate-700 font-medium ml-2">Retake Signature</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Complete Job Button */}
      <TouchableOpacity
        onPress={handleCompleteJob}
        className="bg-[#22c55e] rounded-xl py-4 items-center justify-center flex-row mb-6"
        disabled={!signature}
        style={{ opacity: signature ? 1 : 0.5 }}
      >
        <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
        <Text className="text-white font-semibold text-lg ml-2">Complete Job</Text>
      </TouchableOpacity>
    </View>
  );
}
